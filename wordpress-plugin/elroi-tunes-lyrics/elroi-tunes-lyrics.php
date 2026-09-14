<?php
/**
 * Plugin Name: Elroi Tunes Lyrics (Full)
 * Description: Full Elroi Tunes lyrics editor and API, with reliable edit-field hydration.
 * Version: 1.2.0
 */

if (!defined('ABSPATH')) exit;

// Keep the complete, feature-rich implementation in one place so the replacement
// plugin cannot drift from the original editor, transliteration, SEO, ads, and API.
if (!class_exists('Christian_Lyrics_API')) {
  require_once __DIR__ . '/christian-lyrics-api.inc';
}

register_activation_hook(__FILE__, function () {
  flush_rewrite_rules();
});
