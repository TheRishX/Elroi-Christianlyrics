<?php
/**
 * Plugin Name: Elroi Tunes Video OTT
 * Description: YouTube-backed video library, categories, and private management API for Elroi Tunes.
 * Version: 1.0.0
 */
if (!defined('ABSPATH')) exit;

final class Elroi_Video_OTT {
  private $token;
  public function __construct() { $this->token = getenv('WORDPRESS_API_TOKEN') ?: get_option('elroi_todo_api_token', ''); add_action('init', [$this, 'types']); add_action('rest_api_init', [$this, 'routes']); }
  public function types() {
    register_post_type('elroi_video', ['label'=>'OTT Videos','public'=>false,'show_ui'=>true,'supports'=>['title']]);
    register_taxonomy('elroi_video_category', 'elroi_video', ['label'=>'Video categories','public'=>false,'show_ui'=>true,'hierarchical'=>true]);
    foreach (['youtube_url','youtube_id','description','thumbnail_url','featured','status'] as $meta) register_post_meta('elroi_video', $meta, ['single'=>true,'type'=>'string','show_in_rest'=>false]);
  }
  public function routes() {
    register_rest_route('lyrics/v1','/videos', ['methods'=>'GET','callback'=>[$this,'videos'],'permission_callback'=>'__return_true']);
    register_rest_route('lyrics/v1','/videos', ['methods'=>'POST','callback'=>[$this,'save_video'],'permission_callback'=>[$this,'private_access']]);
    register_rest_route('lyrics/v1','/videos/(?P<id>\d+)', ['methods'=>'PATCH','callback'=>[$this,'save_video'],'permission_callback'=>[$this,'private_access']]);
    register_rest_route('lyrics/v1','/videos/(?P<id>\d+)', ['methods'=>'DELETE','callback'=>[$this,'delete_video'],'permission_callback'=>[$this,'private_access']]);
    register_rest_route('lyrics/v1','/video-categories', ['methods'=>'GET','callback'=>[$this,'categories'],'permission_callback'=>'__return_true']);
    register_rest_route('lyrics/v1','/video-categories', ['methods'=>'POST','callback'=>[$this,'save_category'],'permission_callback'=>[$this,'private_access']]);
    register_rest_route('lyrics/v1','/video-categories/(?P<id>\d+)', ['methods'=>'PATCH','callback'=>[$this,'save_category'],'permission_callback'=>[$this,'private_access']]);
    register_rest_route('lyrics/v1','/video-categories/(?P<id>\d+)', ['methods'=>'DELETE','callback'=>[$this,'delete_category'],'permission_callback'=>[$this,'private_access']]);
  }
  public function private_access($request) { $provided = trim((string)$request->get_header('X-Elroi-API-Token')); if (!$provided) $provided = trim(str_replace('Bearer ', '', $request->get_header('Authorization'))); return $this->token && $provided && hash_equals($this->token, $provided); }
  private function id($url) { $url = trim((string)$url); if (preg_match('~youtu\.be/([A-Za-z0-9_-]{6,})~', $url, $m)) return $m[1]; if (preg_match('~[?&]v=([A-Za-z0-9_-]{6,})~', $url, $m)) return $m[1]; if (preg_match('~/((?:shorts|embed|live)/)?([A-Za-z0-9_-]{6,})~', $url, $m)) return $m[2]; return ''; }
  private function category_data($term) { return ['id'=>(int)$term->term_id,'slug'=>$term->slug,'name'=>$term->name,'description'=>$term->description,'count'=>(int)$term->count]; }
  private function video_data($post) { $terms=wp_get_object_terms($post->ID,'elroi_video_category'); $term=(!is_wp_error($terms)&&$terms)?$terms[0]:null; return ['id'=>(int)$post->ID,'slug'=>$post->post_name,'title'=>$post->post_title,'description'=>get_post_meta($post->ID,'description',true),'youtubeUrl'=>get_post_meta($post->ID,'youtube_url',true),'youtubeId'=>get_post_meta($post->ID,'youtube_id',true),'thumbnailUrl'=>get_post_meta($post->ID,'thumbnail_url',true),'categoryId'=>$term?(int)$term->term_id:0,'category'=>$term?$this->category_data($term):null,'featured'=>get_post_meta($post->ID,'featured',true)==='1','status'=>$post->post_status==='draft'?'draft':'publish','publishedAt'=>$post->post_date_gmt,'updatedAt'=>$post->post_modified_gmt]; }
  public function categories() { $terms=get_terms(['taxonomy'=>'elroi_video_category','hide_empty'=>false,'orderby'=>'name','order'=>'ASC']); return rest_ensure_response(['items'=>array_map([$this,'category_data'], is_wp_error($terms)?[]:$terms)]); }
  public function videos($request) { $status=$request->get_param('admin')&&$this->private_access($request)?['publish','draft']:'publish'; $args=['post_type'=>'elroi_video','post_status'=>$status,'posts_per_page'=>-1,'orderby'=>'date','order'=>'DESC']; if ($request->get_param('featured')) $args['meta_query']=[['key'=>'featured','value'=>'1']]; $posts=get_posts($args); $items=array_map([$this,'video_data'],$posts); $category=sanitize_title($request->get_param('category')?:''); if($category)$items=array_values(array_filter($items,function($item)use($category){return ($item['category']['slug']??'')===$category;})); return rest_ensure_response(['items'=>$items]); }
  public function save_video($request) { $body=(array)$request->get_json_params(); $id=(int)($request['id']??0); $post=$id?get_post($id):null; if($id&&(!$post||$post->post_type!=='elroi_video'))return new WP_Error('not_found','Video not found',['status'=>404]); $url=esc_url_raw($body['youtubeUrl']??($post?get_post_meta($id,'youtube_url',true):'')); $youtube_id=$this->id($url); if(!$youtube_id)return new WP_Error('invalid_youtube','Paste a valid YouTube link.',['status'=>400]); $title=sanitize_text_field($body['title']??($post?$post->post_title:'')); if(!$title)return new WP_Error('missing_title','Video title is required.',['status'=>400]); $post_id=wp_insert_post(['ID'=>$id,'post_type'=>'elroi_video','post_status'=>($body['status']??'publish')==='draft'?'draft':'publish','post_title'=>$title,'post_name'=>sanitize_title($body['slug']??$title)],true); if(is_wp_error($post_id))return$post_id; update_post_meta($post_id,'youtube_url',$url); update_post_meta($post_id,'youtube_id',$youtube_id); update_post_meta($post_id,'description',sanitize_textarea_field($body['description']??'')); update_post_meta($post_id,'thumbnail_url',esc_url_raw($body['thumbnailUrl']??'')); update_post_meta($post_id,'featured',!empty($body['featured'])?'1':'0'); $category=(int)($body['categoryId']??0); wp_set_object_terms($post_id,$category?[$category]:[],'elroi_video_category',false); return new WP_REST_Response($this->video_data(get_post($post_id)), $id?200:201); }
  public function delete_video($request) { $id=(int)$request['id']; $post=get_post($id); if(!$post||$post->post_type!=='elroi_video')return new WP_Error('not_found','Video not found',['status'=>404]); wp_delete_post($id,true); return rest_ensure_response(['ok'=>true]); }
  public function save_category($request) { $body=(array)$request->get_json_params(); $id=(int)($request['id']??0); $name=sanitize_text_field($body['name']??''); if(!$name)return new WP_Error('missing_name','Category name is required.',['status'=>400]); if($id){$term=wp_update_term($id,'elroi_video_category',['name'=>$name,'description'=>sanitize_textarea_field($body['description']??'')]);}else{$term=wp_insert_term($name,'elroi_video_category',['description'=>sanitize_textarea_field($body['description']??'')]);} if(is_wp_error($term))return$term; $term_id=$id?$id:$term['term_id']; return new WP_REST_Response($this->category_data(get_term($term_id,'elroi_video_category')), $id?200:201); }
  public function delete_category($request) { $id=(int)$request['id']; if(!term_exists($id,'elroi_video_category'))return new WP_Error('not_found','Category not found',['status'=>404]); wp_delete_term($id,'elroi_video_category'); return rest_ensure_response(['ok'=>true]); }
}
new Elroi_Video_OTT();
