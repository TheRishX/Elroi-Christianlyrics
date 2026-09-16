<?php
/**
 * Plugin Name: Elroi Tunes Publisher
 * Description: Private REST publishing endpoint for the Elroi Tunes lyrics portal.
 * Version: 1.0.0
 */
if (!defined('ABSPATH')) exit;

final class Elroi_Tunes_Publisher {
  private $token;
  public function __construct() {
    // Hosting panels commonly do not expose custom PHP environment variables.
    // Reuse the private token already stored by the active lyrics plugin first.
    $this->token = getenv('WORDPRESS_API_TOKEN') ?: get_option('elroi_todo_api_token', '');
    add_action('rest_api_init', [$this, 'routes']);
  }
  public function routes() {
    register_rest_route('elroi-publisher/v1', '/songs', [
      'methods' => 'POST', 'callback' => [$this, 'publish_song'], 'permission_callback' => [$this, 'permission'],
    ]);
    register_rest_route('elroi-publisher/v1', '/songs/(?P<id>\d+)', [
      'methods' => 'PATCH', 'callback' => [$this, 'update_song'], 'permission_callback' => [$this, 'permission'],
    ]);
  }
  public function update_song($request) {
    $post = get_post((int) $request['id']);
    if (!$post || $post->post_type !== 'song') return new WP_Error('not_found', 'Song not found.', ['status' => 404]);
    $body = (array) $request->get_json_params();
    $body['slug'] = $post->post_name;
    foreach (['title', 'language', 'artist', 'worshipTeam', 'lyrics'] as $field) {
      if (!array_key_exists($field, $body)) {
        $meta = ['title' => $post->post_title, 'language' => get_post_meta($post->ID, 'language', true), 'artist' => get_post_meta($post->ID, 'artist', true), 'worshipTeam' => get_post_meta($post->ID, 'worship_team', true), 'lyrics' => json_decode(get_post_meta($post->ID, 'lyrics', true) ?: '[]', true)];
        $body[$field] = $meta[$field];
      }
    }
    $proxy = new WP_REST_Request('POST');
    $proxy->set_body(wp_json_encode($body));
    return $this->publish_song($proxy);
  }
  public function permission($request) {
    if (!$this->token) return new WP_Error('publisher_not_configured', 'Publisher token is not configured.', ['status' => 503]);
    $provided = $request->get_header('x-elroi-api-token');
    if (!$provided) $provided = trim(str_replace('Bearer ', '', $request->get_header('authorization')));
    return hash_equals($this->token, (string) $provided) ? true : new WP_Error('forbidden', 'Invalid publisher token.', ['status' => 403]);
  }
  private function text($value) {
    $text = sanitize_textarea_field((string) $value);
    $text = str_replace(["\\r\\n", "\\n", "\\r"], "\n", $text);
    $text = preg_replace('/n(?=\s*\[[^\]\r\n]+\])/u', "\n", $text);
    $text = preg_replace('/n(?=\s*(?:pre-chorus|verse|chorus|bridge|intro|outro|refrain)\b)/iu', "\n", $text);
    $text = preg_replace('/n(?=[\x{0900}-\x{097F}])/u', "\n", $text);
    $text = preg_replace('/(?<=[\p{Ll}\p{M}\d)])n(?=[A-Z])/u', "\n", $text) ?: $text;
    $text = preg_replace('/(?<=[\x{0900}-\x{097F}])n(?=\s*(?:\R|$))/u', '', $text) ?: $text;
    return preg_replace('/(?<=\))n(?=\s*(?:\R|$))/u', '', $text) ?: $text;
  }
  private function list($value) {
    if (!is_array($value)) return [];
    return array_values(array_filter(array_map(function($item) { return sanitize_text_field((string) $item); }, $value)));
  }
  private function lyrics($value) {
    if (!is_array($value)) return [];
    $items = [];
    foreach ($value as $section) {
      if (!is_array($section)) continue;
      $original = $this->text($section['original'] ?? '');
      $roman = $this->text($section['roman'] ?? '');
      if (!$original && !$roman) continue;
      $items[] = ['label' => sanitize_text_field($section['label'] ?? 'Section'), 'original' => $original, 'roman' => $roman];
    }
    return $items;
  }
  public function publish_song($request) {
    $body = (array) $request->get_json_params();
    $title = sanitize_text_field($body['title'] ?? '');
    $language = sanitize_key($body['language'] ?? 'english');
    $artist = sanitize_text_field($body['artist'] ?? '');
    $artists = array_values(array_unique(array_filter(array_map('sanitize_text_field', (array) ($body['artists'] ?? [$artist])))));
    if (!$artist && $artists) $artist = $artists[0];
    $lyrics = $this->lyrics($body['lyrics'] ?? []);
    if (!$title || !$artist || !$lyrics || !in_array($language, ['hindi', 'nepali', 'english'], true)) return new WP_Error('invalid_song', 'Title, artist, language, and lyrics are required.', ['status' => 400]);
    $slug = sanitize_title($body['slug'] ?? $title);
    $existing = get_page_by_path($slug, OBJECT, 'song');
    $post = ['post_type' => 'song', 'post_title' => $title, 'post_name' => $slug, 'post_status' => ($body['status'] ?? 'publish') === 'draft' ? 'draft' : 'publish', 'post_content' => $this->content($lyrics)];
    if ($existing) { $post['ID'] = $existing->ID; $id = wp_update_post($post, true); } else { $id = wp_insert_post($post, true); }
    if (is_wp_error($id)) return $id;
    $meta = ['roman_title'=>'romanTitle','artist'=>'artist','worship_team'=>'worshipTeam','composer'=>'composer','lyricist'=>'lyricist','album'=>'album','release_year'=>'releaseYear','song_key'=>'songKey','tempo'=>'tempo','youtube_url'=>'youtubeUrl','audio_url'=>'audioUrl','excerpt'=>'excerpt','last_reviewed_at'=>'lastReviewedAt'];
    foreach ($meta as $key => $field) update_post_meta($id, $key, $this->text($body[$field] ?? ''));
    update_post_meta($id, 'artist_ids', wp_json_encode(array_values(array_filter(array_map('absint', (array) ($body['artistIds'] ?? []))))));
    update_post_meta($id, 'artists', wp_json_encode($artists ?: [$artist], JSON_UNESCAPED_UNICODE));
    update_post_meta($id, 'language', $language); update_post_meta($id, 'lyrics', wp_json_encode($lyrics, JSON_UNESCAPED_UNICODE));
    $alternate_titles = $this->list($body['alternateTitles'] ?? []); if (!$alternate_titles) $alternate_titles = [$title];
    $roman_alternate_titles = $this->list($body['romanAlternateTitles'] ?? []); if (!$roman_alternate_titles) $roman_alternate_titles = array_filter([$body['romanTitle'] ?? '']);
    update_post_meta($id, 'alternate_titles', wp_json_encode($alternate_titles, JSON_UNESCAPED_UNICODE));
    update_post_meta($id, 'roman_alternate_titles', wp_json_encode($roman_alternate_titles, JSON_UNESCAPED_UNICODE));
    update_post_meta($id, 'seo_title', $this->text($body['seo']['title'] ?? '')); update_post_meta($id, 'seo_description', $this->text($body['seo']['description'] ?? ''));
    update_post_meta($id, 'youtube_metadata', wp_json_encode(is_array($body['youtube'] ?? null) ? $body['youtube'] : [], JSON_UNESCAPED_UNICODE));
    foreach (['genre'=>'genres','worship_category'=>'categories','theme'=>'themes','occasion'=>'occasions'] as $taxonomy => $field) if (taxonomy_exists($taxonomy)) wp_set_object_terms($id, $this->list($body[$field] ?? []), $taxonomy, false);
    $post_object = get_post($id); $this->revalidate($post_object);
    return new WP_REST_Response(['id'=>(int)$id, 'slug'=>$post_object->post_name, 'status'=>$post_object->post_status, 'url'=>get_permalink($id)], $existing ? 200 : 201);
  }
  private function content($lyrics) { $html = ''; foreach ($lyrics as $section) $html .= '<h3>' . esc_html($section['label']) . '</h3><p>' . nl2br(esc_html($section['original'])) . '</p>'; return $html; }
  private function revalidate($post) {
    $url = getenv('VERCEL_REVALIDATE_URL') ?: getenv('SONGLIGHT_REVALIDATE_URL'); $secret = getenv('WORDPRESS_WEBHOOK_SECRET') ?: getenv('SONGLIGHT_REVALIDATE_SECRET');
    if (!$url || !$secret) return;
    wp_remote_post($url, ['timeout'=>5, 'blocking'=>false, 'headers'=>['Content-Type'=>'application/json','X-Webhook-Secret'=>$secret], 'body'=>wp_json_encode(['slug'=>$post->post_name,'status'=>$post->post_status,'language'=>get_post_meta($post->ID,'language',true)])]);
  }
}
new Elroi_Tunes_Publisher();
