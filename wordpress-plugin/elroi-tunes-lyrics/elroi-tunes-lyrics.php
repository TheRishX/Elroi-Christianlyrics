<?php
/**
 * Plugin Name: Elroi Tunes Lyrics
 * Description: Song editor and REST API for Elroi Tunes lyrics.
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) exit;

final class Elroi_Tunes_Lyrics {
  private $meta = [
    'language', 'artist', 'worship_team', 'lyrics', 'roman_title',
    'youtube_url', 'audio_url', 'excerpt', 'seo_title', 'seo_description',
  ];

  public function __construct() {
    add_action('init', [$this, 'register_content']);
    add_action('add_meta_boxes', [$this, 'add_editor']);
    add_action('save_post_song', [$this, 'save_song'], 10, 2);
    add_action('rest_api_init', [$this, 'register_api']);
  }

  public function register_content() {
    register_post_type('song', [
      'label' => 'Songs',
      'public' => true,
      'show_in_rest' => true,
      'supports' => ['title', 'editor', 'excerpt', 'thumbnail'],
      'rewrite' => ['slug' => 'songs'],
    ]);
    foreach ($this->meta as $key) {
      register_post_meta('song', $key, [
        'single' => true,
        'type' => 'string',
        'show_in_rest' => true,
        'auth_callback' => function () { return current_user_can('edit_posts'); },
      ]);
    }
  }

  public function add_editor() {
    add_meta_box(
      'elroi_tunes_lyrics',
      'Elroi Tunes song details',
      [$this, 'render_editor'],
      'song',
      'normal',
      'high'
    );
  }

  private function value($post_id, $key) {
    return (string) get_post_meta($post_id, $key, true);
  }

  private function lyric_text($raw, $key) {
    $rows = json_decode((string) $raw, true);
    if (!is_array($rows)) return '';
    return implode("\n\n", array_map(function ($row) use ($key) {
      if (!is_array($row)) return '';
      return (string) ($row[$key] ?? ($key === 'original' ? ($row['text'] ?? '') : ''));
    }, $rows));
  }

  public function render_editor($post) {
    wp_nonce_field('elroi_tunes_save_song', 'elroi_tunes_nonce');
    $language = $this->value($post->ID, 'language') ?: 'hindi';
    $stored = $this->value($post->ID, 'lyrics');
    $original = $this->lyric_text($stored, 'original');
    $roman = $this->lyric_text($stored, 'roman');
    if (!$original && $post->post_content) $original = wp_strip_all_tags($post->post_content);
    ?>
    <style>
      .elroi-editor{background:#fbfcf9;border:1px solid #dfe8d8;border-radius:14px;padding:24px}
      .elroi-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
      .elroi-field label{display:block;font-weight:600;margin:0 0 8px;color:#263329}
      .elroi-field input,.elroi-field select,.elroi-field textarea{box-sizing:border-box;width:100%;border:1px solid #cdd9c6;border-radius:8px;padding:11px 13px;background:#fff;font-size:15px}
      .elroi-field textarea{line-height:1.6;resize:vertical}
      .elroi-wide{grid-column:1/-1}
      @media(max-width:782px){.elroi-grid{grid-template-columns:1fr}.elroi-wide{grid-column:auto}}
    </style>
    <div class="elroi-editor">
      <div class="elroi-grid">
        <div class="elroi-field">
          <label for="elroi_language">Language</label>
          <select id="elroi_language" name="elroi_language">
            <option value="hindi" <?php selected($language, 'hindi'); ?>>Hindi / हिन्दी</option>
            <option value="nepali" <?php selected($language, 'nepali'); ?>>Nepali / नेपाली</option>
            <option value="english" <?php selected($language, 'english'); ?>>English</option>
          </select>
        </div>
        <div class="elroi-field">
          <label for="elroi_artist">Artist / singer</label>
          <input id="elroi_artist" name="elroi_artist" value="<?php echo esc_attr($this->value($post->ID, 'artist')); ?>">
        </div>
        <div class="elroi-field">
          <label for="elroi_worship_team">Worship team</label>
          <input id="elroi_worship_team" name="elroi_worship_team" value="<?php echo esc_attr($this->value($post->ID, 'worship_team')); ?>">
        </div>
        <div class="elroi-field">
          <label for="elroi_youtube_url">YouTube / YouTube Music URL</label>
          <input id="elroi_youtube_url" name="elroi_youtube_url" type="url" value="<?php echo esc_attr($this->value($post->ID, 'youtube_url')); ?>">
        </div>
      </div>
      <div class="elroi-grid">
        <div class="elroi-field">
          <label for="elroi_original">Hindi / Nepali lyrics</label>
          <textarea id="elroi_original" name="elroi_original" rows="16"><?php echo esc_textarea($original); ?></textarea>
        </div>
        <div class="elroi-field">
          <label for="elroi_roman">English / Roman lyrics</label>
          <textarea id="elroi_roman" name="elroi_roman" rows="16"><?php echo esc_textarea($roman); ?></textarea>
        </div>
      </div>
      <div class="elroi-grid">
        <div class="elroi-field elroi-wide">
          <label for="elroi_excerpt">Short description</label>
          <textarea id="elroi_excerpt" name="elroi_excerpt" rows="3"><?php echo esc_textarea($this->value($post->ID, 'excerpt')); ?></textarea>
        </div>
      </div>
      <p><strong>Saved automatically:</strong> the visible fields above are populated from WordPress when you reopen this song.</p>
    </div>
    <?php
  }

  private function sections($original, $roman) {
    $a = preg_split('/\R\s*\R/', trim($original));
    $b = $roman === '' ? [] : preg_split('/\R\s*\R/', trim($roman));
    $a = array_values(array_filter(array_map('trim', $a), 'strlen'));
    $out = [];
    foreach ($a as $i => $text) {
      $out[] = [
        'label' => ['Verse 1', 'Chorus', 'Verse 2', 'Bridge', 'Ending'][$i] ?? 'Section ' . ($i + 1),
        'original' => $text,
        'roman' => trim($b[$i] ?? ''),
      ];
    }
    return $out;
  }

  public function save_song($post_id, $post) {
    if (
      !isset($_POST['elroi_tunes_nonce']) ||
      !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['elroi_tunes_nonce'])), 'elroi_tunes_save_song') ||
      defined('DOING_AUTOSAVE') && DOING_AUTOSAVE ||
      wp_is_post_revision($post_id) ||
      !current_user_can('edit_post', $post_id) ||
      $post->post_type !== 'song'
    ) return;

    $language = sanitize_key(wp_unslash($_POST['elroi_language'] ?? 'hindi'));
    if (!in_array($language, ['hindi', 'nepali', 'english'], true)) $language = 'hindi';
    $original = sanitize_textarea_field(wp_unslash($_POST['elroi_original'] ?? ''));
    $roman = sanitize_textarea_field(wp_unslash($_POST['elroi_roman'] ?? ''));
    $values = [
      'language' => $language,
      'artist' => sanitize_text_field(wp_unslash($_POST['elroi_artist'] ?? '')),
      'worship_team' => sanitize_text_field(wp_unslash($_POST['elroi_worship_team'] ?? '')),
      'lyrics' => wp_json_encode($this->sections($original, $roman), JSON_UNESCAPED_UNICODE),
      'youtube_url' => esc_url_raw(wp_unslash($_POST['elroi_youtube_url'] ?? '')),
      'excerpt' => sanitize_textarea_field(wp_unslash($_POST['elroi_excerpt'] ?? '')),
    ];
    foreach ($values as $key => $value) update_post_meta($post_id, $key, $value);
  }

  private function normalize($post) {
    $lyrics = json_decode($this->value($post->ID, 'lyrics') ?: '[]', true);
    return [
      'id' => $post->ID,
      'slug' => $post->post_name,
      'title' => get_the_title($post),
      'romanTitle' => $this->value($post->ID, 'roman_title'),
      'language' => $this->value($post->ID, 'language') ?: 'english',
      'artist' => $this->value($post->ID, 'artist') ?: $this->value($post->ID, 'worship_team'),
      'lyrics' => is_array($lyrics) ? $lyrics : [],
      'youtubeUrl' => $this->value($post->ID, 'youtube_url'),
      'audioUrl' => $this->value($post->ID, 'audio_url'),
      'excerpt' => $this->value($post->ID, 'excerpt'),
      'seo' => [
        'title' => $this->value($post->ID, 'seo_title'),
        'description' => $this->value($post->ID, 'seo_description'),
      ],
      'updatedAt' => $post->post_modified_gmt,
    ];
  }

  public function register_api() {
    register_rest_route('lyrics/v1', '/songs', [
      'methods' => 'GET',
      'callback' => function () {
        $posts = get_posts(['post_type' => 'song', 'post_status' => 'publish', 'numberposts' => 50, 'orderby' => 'modified', 'order' => 'DESC']);
        return rest_ensure_response(['items' => array_map([$this, 'normalize'], $posts), 'total' => count($posts)]);
      },
      'permission_callback' => '__return_true',
    ]);
    register_rest_route('lyrics/v1', '/songs/(?P<slug>[\w-]+)', [
      'methods' => 'GET',
      'callback' => function ($request) {
        $posts = get_posts(['post_type' => 'song', 'name' => sanitize_title($request['slug']), 'post_status' => 'publish', 'numberposts' => 1]);
        return $posts ? rest_ensure_response($this->normalize($posts[0])) : new WP_Error('not_found', 'Song not found', ['status' => 404]);
      },
      'permission_callback' => '__return_true',
    ]);
    register_rest_route('lyrics/v1', '/search', [
      'methods' => 'GET',
      'callback' => function ($request) {
        $query = mb_strtolower(sanitize_text_field($request->get_param('q') ?: ''));
        if ($query === '') return rest_ensure_response(['items' => [], 'total' => 0]);
        $posts = get_posts(['post_type' => 'song', 'post_status' => 'publish', 'numberposts' => 100]);
        $matches = [];
        foreach ($posts as $post) {
          $song = $this->normalize($post);
          $haystack = mb_strtolower($song['title'] . ' ' . $song['romanTitle'] . ' ' . $song['artist']);
          foreach ((array) $song['lyrics'] as $section) {
            $haystack .= ' ' . mb_strtolower(($section['original'] ?? '') . ' ' . ($section['roman'] ?? ''));
          }
          if (mb_strpos($haystack, $query) !== false) $matches[] = $song;
        }
        return rest_ensure_response(['items' => $matches, 'total' => count($matches)]);
      },
      'permission_callback' => '__return_true',
    ]);
  }
}

new Elroi_Tunes_Lyrics();
