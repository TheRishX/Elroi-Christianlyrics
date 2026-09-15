<?php
/**
 * Plugin Name: Elroi Artist Profiles API
 * Description: Standalone artist profiles and profile image API for Elroi Tunes.
 * Version: 3.0.0
 */
if (!defined('ABSPATH')) exit;

final class Elroi_Artist_Profiles_V3 {
  private $post_type = 'elroi_artist_profile';

  public function __construct() {
    add_action('init', [$this, 'register_post_type']);
    add_action('rest_api_init', [$this, 'register_routes']);
  }

  public function register_post_type() {
    register_post_type($this->post_type, [
      'label' => 'Artist Profiles',
      'public' => true,
      'show_in_rest' => false,
      'supports' => ['title', 'thumbnail'],
      'rewrite' => ['slug' => 'artist-profiles'],
      'menu_icon' => 'dashicons-groups',
    ]);
  }

  public function register_routes() {
    register_rest_route('lyrics/v1', '/artists', [
      'methods' => WP_REST_Server::READABLE,
      'callback' => [$this, 'list_artists'],
      'permission_callback' => '__return_true',
    ]);
    register_rest_route('lyrics/v1', '/artists', [
      'methods' => WP_REST_Server::CREATABLE,
      'callback' => [$this, 'create_artist'],
      'permission_callback' => [$this, 'private_access'],
    ]);
    register_rest_route('lyrics/v1', '/artists/(?P<id>\d+)', [
      'methods' => WP_REST_Server::EDITABLE,
      'callback' => [$this, 'update_artist'],
      'permission_callback' => [$this, 'private_access'],
    ]);
    register_rest_route('lyrics/v1', '/artists/(?P<id>\d+)', [
      'methods' => WP_REST_Server::DELETABLE,
      'callback' => [$this, 'delete_artist'],
      'permission_callback' => [$this, 'private_access'],
    ]);
    register_rest_route('lyrics/v1', '/artists/(?P<id>\d+)/image', [
      'methods' => WP_REST_Server::CREATABLE,
      'callback' => [$this, 'upload_artist_image'],
      'permission_callback' => [$this, 'private_access'],
    ]);
    register_rest_route('lyrics/v1', '/artists/health', [
      'methods' => WP_REST_Server::READABLE,
      'callback' => function () { return rest_ensure_response(['ok' => true, 'version' => '3.0.0']); },
      'permission_callback' => '__return_true',
    ]);
  }

  public function private_access($request) {
    $provided = trim((string) $request->get_header('X-Elroi-API-Token'));
    if (!$provided) {
      $authorization = (string) $request->get_header('Authorization');
      if (preg_match('/^Bearer\s+(.+)$/i', $authorization, $match)) $provided = trim($match[1]);
    }
    $stored = trim((string) get_option('elroi_todo_api_token', ''));
    return $stored !== '' && $provided !== '' && hash_equals($stored, $provided);
  }

  private function data($post) {
    return ['id' => (int) $post->ID, 'slug' => $post->post_name, 'name' => get_the_title($post), 'image' => get_the_post_thumbnail_url($post->ID, 'medium') ?: ''];
  }

  public function list_artists() {
    $posts = get_posts(['post_type' => $this->post_type, 'post_status' => 'publish', 'posts_per_page' => -1, 'orderby' => 'title', 'order' => 'ASC']);
    return rest_ensure_response(['items' => array_map([$this, 'data'], $posts)]);
  }

  public function create_artist($request) {
    $body = (array) $request->get_json_params();
    $name = sanitize_text_field($body['name'] ?? '');
    if (!$name) return new WP_Error('missing_artist', 'Artist name is required.', ['status' => 400]);
    $existing = get_page_by_title($name, OBJECT, $this->post_type);
    if ($existing) { if (!empty($body['imageData'])) $this->save_image($existing->ID, $body['imageData'], $name); return rest_ensure_response($this->data(get_post($existing->ID))); }
    $id = wp_insert_post(['post_type' => $this->post_type, 'post_status' => 'publish', 'post_title' => $name, 'post_name' => sanitize_title($name)], true);
    if (is_wp_error($id)) return $id;
    if (!empty($body['imageData'])) { $error = $this->save_image($id, $body['imageData'], $name); if (is_wp_error($error)) { wp_delete_post($id, true); return $error; } }
    return new WP_REST_Response($this->data(get_post($id)), 201);
  }

  public function update_artist($request) {
    $post = get_post((int) $request['id']);
    if (!$post || $post->post_type !== $this->post_type) return new WP_Error('not_found', 'Artist profile not found.', ['status' => 404]);
    $body = (array) $request->get_json_params();
    $name = sanitize_text_field($body['name'] ?? $post->post_title);
    $updated = wp_update_post(['ID' => $post->ID, 'post_title' => $name, 'post_name' => sanitize_title($name)], true);
    if (is_wp_error($updated)) return $updated;
    if (!empty($body['imageData'])) { $error = $this->save_image($post->ID, $body['imageData'], $name); if (is_wp_error($error)) return $error; }
    if (!empty($body['removeImage'])) delete_post_thumbnail($post->ID);
    return rest_ensure_response($this->data(get_post($post->ID)));
  }

  public function delete_artist($request) {
    $post = get_post((int) $request['id']);
    if (!$post || $post->post_type !== $this->post_type) return new WP_Error('not_found', 'Artist profile not found.', ['status' => 404]);
    wp_delete_post($post->ID, true);
    return rest_ensure_response(['ok' => true]);
  }

  public function upload_artist_image($request) {
    $post = get_post((int) $request['id']);
    if (!$post || $post->post_type !== $this->post_type) return new WP_Error('not_found', 'Artist profile not found.', ['status' => 404]);
    $body = (array) $request->get_json_params();
    $result = $this->save_image($post->ID, $body['imageData'] ?? '', $post->post_title);
    if (is_wp_error($result)) return $result;
    return rest_ensure_response($this->data(get_post($post->ID)));
  }

  private function save_image($id, $data, $name) {
    if (!preg_match('/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/s', (string) $data, $match)) return new WP_Error('invalid_image', 'Profile image must be a valid PNG, JPG, WEBP, or GIF.', ['status' => 400]);
    $binary = base64_decode($match[2], true);
    if ($binary === false || strlen($binary) > 8 * 1024 * 1024) return new WP_Error('image_too_large', 'Profile images must be smaller than 8 MB.', ['status' => 400]);
    $upload = wp_upload_bits(sanitize_title($name) . '-profile.' . $match[1], null, $binary);
    if ($upload['error']) return new WP_Error('image_upload_failed', $upload['error'], ['status' => 500]);
    $filetype = wp_check_filetype($upload['file']);
    $attachment = wp_insert_attachment(['post_mime_type' => $filetype['type'], 'post_title' => $name . ' profile image', 'post_status' => 'inherit'], $upload['file'], $id);
    if (is_wp_error($attachment)) return $attachment;
    require_once ABSPATH . 'wp-admin/includes/image.php';
    wp_update_attachment_metadata($attachment, wp_generate_attachment_metadata($attachment, $upload['file']));
    set_post_thumbnail($id, $attachment);
    return true;
  }
}

new Elroi_Artist_Profiles_V3();
