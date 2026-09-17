<?php
/**
 * Plugin Name: Elroi Tunes Publisher
 * Description: Canonical, authenticated song persistence API for Elroi Tunes.
 * Version: 2.1.0
 */
if (!defined('ABSPATH')) exit;

final class Elroi_Tunes_Publisher {
  private $token;
  private $text_meta = ['roman_title','artist','worship_team','composer','lyricist','album','release_year','song_key','tempo','youtube_url','audio_url','excerpt','last_reviewed_at','seo_title','seo_description'];
  public function __construct() {
    $this->token = getenv('WORDPRESS_API_TOKEN') ?: get_option('elroi_todo_api_token', '');
    add_action('rest_api_init', [$this, 'routes']);
  }
  public function routes() {
    register_rest_route('elroi-publisher/v1', '/capabilities', ['methods'=>'GET','callback'=>[$this,'capabilities'],'permission_callback'=>[$this,'permission']]);
    register_rest_route('elroi-publisher/v1', '/songs', ['methods'=>['GET','POST'],'callback'=>[$this,'songs'],'permission_callback'=>[$this,'permission']]);
    register_rest_route('elroi-publisher/v1', '/songs/(?P<id>\d+)', ['methods'=>['GET','PATCH','DELETE'],'callback'=>[$this,'song'],'permission_callback'=>[$this,'permission']]);
    register_rest_route('elroi-publisher/v1', '/songs/(?P<id>\d+)/restore', ['methods'=>'POST','callback'=>[$this,'restore'],'permission_callback'=>[$this,'permission']]);
  }
  public function permission($request) {
    if (!$this->token) return new WP_Error('publisher_not_configured','Publisher token is not configured.',['status'=>503]);
    $provided = $request->get_header('x-elroi-api-token');
    if (!$provided && preg_match('/^Bearer\s+(.+)$/i', $request->get_header('authorization'), $m)) $provided = $m[1];
    return is_string($provided) && strlen($provided) === strlen($this->token) && hash_equals($this->token, $provided) ? true : new WP_Error('forbidden','Invalid publisher token.',['status'=>403]);
  }
  public function capabilities() { return rest_ensure_response(['version'=>'2.1.0','schemaVersion'=>3,'actions'=>['create','patch','trash','restore'],'revisionRequired'=>true,'lyricsFormat'=>'section-lines']); }
  private function text($value) { return str_replace(["\r\n","\r"], "\n", sanitize_textarea_field((string)$value)); }
  private function lines($value) {
    if (is_array($value)) return array_map(function($line){ return $this->text($line); }, array_values($value));
    $text=$this->text($value);
    return $text==='' ? [] : explode("\n",$text);
  }
  private function list_value($value) { if (!is_array($value)) return []; return array_values(array_filter(array_map(function($v){ return sanitize_text_field((string)$v); },$value), 'strlen')); }
  private function encode($value) { $json=wp_json_encode($value,JSON_UNESCAPED_UNICODE); return $json===false ? new WP_Error('encoding_failed','Document could not be encoded.',['status'=>422]) : wp_slash($json); }
  private function decode($id,$key,$required=false) {
    $raw=get_post_meta($id,$key,true);
    if ($raw==='' && !$required) return [];
    $value=json_decode($raw,true);
    if (json_last_error()!==JSON_ERROR_NONE || !is_array($value)) return new WP_Error('integrity_failure',"Stored $key is invalid; recovery is required.",['status'=>409]);
    return $value;
  }
  private function write_json($id,$key,$value) {
    $encoded=$this->encode($value); if (is_wp_error($encoded)) return $encoded;
    update_post_meta($id,$key,$encoded);
    $stored=get_post_meta($id,$key,true); $decoded=json_decode($stored,true);
    if (json_last_error()!==JSON_ERROR_NONE || $decoded!==$value) return new WP_Error('integrity_failure',"Could not verify $key after saving.",['status'=>500]);
    return true;
  }
  private function lyrics($value,$allow_empty=false) {
    if (!is_array($value)) return new WP_Error('invalid_lyrics','Lyrics must be a section array.',['status'=>422]);
    $items=[]; foreach($value as $section) {
      if (!is_array($section)) return new WP_Error('invalid_lyrics','Every lyric section must be an object.',['status'=>422]);
      $original=$this->lines(array_key_exists('originalLines',$section)?$section['originalLines']:($section['original']??''));
      $roman=$this->lines(array_key_exists('romanLines',$section)?$section['romanLines']:($section['roman']??''));
      if (!array_filter($original,'strlen') && !array_filter($roman,'strlen')) continue;
      $items[]=['id'=>sanitize_text_field($section['id']??wp_generate_uuid4()),'label'=>sanitize_text_field($section['label']??'Section'),'originalLines'=>$original,'romanLines'=>$roman];
    }
    if (!$allow_empty && !$items) return new WP_Error('empty_lyrics','At least one non-empty lyric section is required.',['status'=>422]);
    return $items;
  }
  private function revision($id) { return max(1,(int)get_post_meta($id,'elroi_revision',true)); }
  private function document($post) {
    $lyrics=$this->decode($post->ID,'lyrics',true); if (is_wp_error($lyrics)) return ['id'=>(int)$post->ID,'integrity'=>'recovery_required','revision'=>$this->revision($post->ID)];
    $data=['schemaVersion'=>2,'id'=>(int)$post->ID,'revision'=>$this->revision($post->ID),'status'=>$post->post_status,'slug'=>$post->post_name,'title'=>$post->post_title,'language'=>get_post_meta($post->ID,'language',true),'lyrics'=>$lyrics];
    foreach($this->text_meta as $key) $data[$this->camel($key)]=get_post_meta($post->ID,$key,true);
    foreach(['artists','artist_ids','alternate_titles','roman_alternate_titles','youtube_metadata'] as $key) { $value=$this->decode($post->ID,$key); $data[$this->camel($key)]=is_wp_error($value)?[]:$value; }
    return $data;
  }
  private function camel($key) { return preg_replace_callback('/_([a-z])/',function($m){return strtoupper($m[1]);},$key); }
  private function content($lyrics) { $html=''; foreach($lyrics as $section) { $original=implode("\n",$section['originalLines']??[]); $html.='<h3>'.esc_html($section['label']).'</h3><p>'.nl2br(esc_html($original)).'</p>'; } return $html; }
  private function expected_revision($request,$post) {
    $expected=(int)$request->get_header('if-match'); if (!$expected) return new WP_Error('revision_required','If-Match revision is required.',['status'=>400]);
    return $expected===$this->revision($post->ID) ? true : new WP_Error('revision_conflict','Song was changed by another editor.',['status'=>409]);
  }
  public function songs($request) {
    if ($request->get_method()==='GET') { $page=max(1,(int)$request->get_param('page')); $per_page=min(50,max(1,(int)$request->get_param('per_page')?:50)); $query=new WP_Query(['post_type'=>'song','post_status'=>['publish','draft','trash'],'posts_per_page'=>$per_page,'paged'=>$page,'orderby'=>'modified','order'=>'DESC']); return rest_ensure_response(['items'=>array_map([$this,'document'],$query->posts),'page'=>$page,'pages'=>(int)$query->max_num_pages,'total'=>(int)$query->found_posts]); }
    $body=(array)$request->get_json_params(); $title=sanitize_text_field($body['title']??''); $artist=sanitize_text_field($body['artist']??''); $language=sanitize_key($body['language']??''); $lyrics=$this->lyrics($body['lyrics']??null);
    if (!$title||!$artist||!in_array($language,['hindi','nepali','english'],true)||is_wp_error($lyrics)) return is_wp_error($lyrics)?$lyrics:new WP_Error('invalid_song','Title, artist, language and lyrics are required.',['status'=>422]);
    $slug=sanitize_title($body['slug']??$title); if (get_page_by_path($slug,OBJECT,'song')) return new WP_Error('duplicate_slug','A song already uses this slug.',['status'=>409]);
    $id=wp_insert_post(['post_type'=>'song','post_title'=>$title,'post_name'=>$slug,'post_status'=>($body['status']??'draft')==='publish'?'publish':'draft','post_content'=>$this->content($lyrics)],true); if(is_wp_error($id))return $id;
    $result=$this->persist($id,$body,$lyrics,true); if(is_wp_error($result)){wp_trash_post($id);return $result;} return new WP_REST_Response($this->document(get_post($id)),201);
  }
  public function song($request) {
    $post=get_post((int)$request['id']); if(!$post||$post->post_type!=='song')return new WP_Error('not_found','Song not found.',['status'=>404]);
    if($request->get_method()==='GET')return rest_ensure_response($this->document($post));
    $check=$this->expected_revision($request,$post); if(is_wp_error($check))return $check;
    if($request->get_method()==='DELETE'){ $this->snapshot($post->ID); return wp_trash_post($post->ID)?rest_ensure_response(['ok'=>true,'id'=>$post->ID,'status'=>'trash']):new WP_Error('trash_failed','Song could not be trashed.',['status'=>500]); }
    $body=(array)$request->get_json_params(); if(array_key_exists('lyrics',$body)){ $lyrics=$this->lyrics($body['lyrics'],false); if(is_wp_error($lyrics))return $lyrics; }else{$lyrics=$this->decode($post->ID,'lyrics',true);if(is_wp_error($lyrics))return $lyrics;}
    $this->snapshot($post->ID); $result=$this->persist($post->ID,$body,$lyrics,false); if(is_wp_error($result))return $result; return rest_ensure_response($this->document(get_post($post->ID)));
  }
  private function persist($id,$body,$lyrics,$creating) {
    $post=get_post($id); $update=['ID'=>$id]; foreach(['title'=>'post_title','status'=>'post_status'] as $field=>$key)if(array_key_exists($field,$body))$update[$key]=$field==='status'&&$body[$field]!=='publish'?'draft':sanitize_text_field($body[$field]);
    $update['post_content']=$this->content($lyrics); if(count($update)>2||$creating){$result=wp_update_post($update,true);if(is_wp_error($result))return$result;}
    $fields=['language'=>'language','artist'=>'artist','worshipTeam'=>'worship_team','romanTitle'=>'roman_title','composer'=>'composer','lyricist'=>'lyricist','album'=>'album','releaseYear'=>'release_year','songKey'=>'song_key','tempo'=>'tempo','youtubeUrl'=>'youtube_url','audioUrl'=>'audio_url','excerpt'=>'excerpt','lastReviewedAt'=>'last_reviewed_at'];
    foreach($fields as $field=>$key)if(array_key_exists($field,$body))update_post_meta($id,$key,$field==='language'?sanitize_key($body[$field]):$this->text($body[$field]));
    if($creating){update_post_meta($id,'language',sanitize_key($body['language']));update_post_meta($id,'artist',sanitize_text_field($body['artist']));}
    foreach(['artists'=>'artists','artistIds'=>'artist_ids','alternateTitles'=>'alternate_titles','romanAlternateTitles'=>'roman_alternate_titles','youtube'=>'youtube_metadata'] as $field=>$key)if(array_key_exists($field,$body)||$creating){$value=$field==='artists'?$this->list_value($body[$field]??[$body['artist']??'']):($body[$field]??[]);$ok=$this->write_json($id,$key,$value);if(is_wp_error($ok))return$ok;}
    if(array_key_exists('seo',$body)){ $seo=is_array($body['seo'])?$body['seo']:[]; update_post_meta($id,'seo_title',$this->text($seo['title']??'')); update_post_meta($id,'seo_description',$this->text($seo['description']??'')); }
    $ok=$this->write_json($id,'lyrics',$lyrics);if(is_wp_error($ok))return$ok; update_post_meta($id,'elroi_revision',$this->revision($id)+1); return true;
  }
  private function snapshot($id) { $data=['at'=>gmdate('c'),'revision'=>$this->revision($id),'lyrics_raw'=>get_post_meta($id,'lyrics',true),'meta'=>[]];foreach(array_merge($this->text_meta,['language','artists','artist_ids','alternate_titles','roman_alternate_titles','youtube_metadata'])as$key)$data['meta'][$key]=get_post_meta($id,$key,true);add_post_meta($id,'elroi_song_snapshot',wp_slash(wp_json_encode($data,JSON_UNESCAPED_UNICODE))); }
  public function restore($request) { $post=get_post((int)$request['id']);if(!$post||$post->post_type!=='song')return new WP_Error('not_found','Song not found.',['status'=>404]);$check=$this->expected_revision($request,$post);if(is_wp_error($check))return$check; $result=wp_untrash_post($post->ID);return $result?rest_ensure_response($this->document(get_post($post->ID))):new WP_Error('restore_failed','Song could not be restored.',['status'=>500]); }
}
new Elroi_Tunes_Publisher();
