<?php

/**
 * @link              https://justsend.email/wordpress-plugin
 * @since             1.0.0
 * @package           JustSendEmail
 *
 * @wordpress-plugin
 * Plugin Name:       JustSendEmail Connect
 * Plugin URI:        https://justsend.email/wordpress-plugin
 * Description:       A multi-plugin connector for JustSend.Email services
 * Version:           1.0.0
 * Author:            Flawless Websites LLC
 * Author URI:        https://justsend.email
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       justsendemail-connect
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */
define( 'JSECNCT_VERSION', '1.0.0' );
include_once(ABSPATH.'wp-admin/includes/plugin.php');

// ..... Production OAuth2 SSO for JustSend.Email ..... 
define( 'JSECNCT_IDP_URL', 'https://login.justsend.email');
define( 'JSECNCT_DEV_MODE', false);
define( 'JSECNCT_CLIENT_ID', '1616f96b-9962-4934-8922-0254a03880b6');
define( 'JSECNCT_APP_URL', 'https://app.justsend.email');
define( 'JSECNCT_API_URL', 'https://app.justsend.email/api/');

$jsecnct_authorize_endpoint = JSECNCT_IDP_URL.'/oauth2/authorize?client_id='.JSECNCT_CLIENT_ID.'&scope=openid&response_type=code&redirect_uri='.urlencode(JSECNCT_APP_URL."/sso");

/**
 * Some logging functions we use in development
 */
function jsecnct_file_debug($title, $message) {
  if(JSECNCT_DEV_MODE) file_put_contents("/tmp/jsecnct-plugin.log", "(".$title."): \n".($message ? json_encode($message)."\n" : ""), FILE_APPEND | LOCK_EX);
}

function jsecnct_file_error($error) {
  if(JSECNCT_DEV_MODE) file_put_contents("/tmp/jsecnct-plugin.log", "ERROR: (".$error."): \n", FILE_APPEND | LOCK_EX);
}

/**
 * The code that runs during plugin activation.
 */
function jsecnct_activate_plugin() {
}

/**
 * The code that runs during plugin deactivation.
 */
function jsecnct_deactivate_plugin() {
  /*JSECNCT_Settings::clear_settings();*/
}

register_activation_hook( __FILE__, 'jsecnct__activate_plugin' );
register_deactivation_hook( __FILE__, 'jsecnct_deactivate_plugin' );

require_once plugin_dir_path(__FILE__) . 'classes/class-jse-menu.php';
require_once plugin_dir_path(__FILE__) . 'classes/class-jse-settings.php';
/* Internal Wordpress Custom API */
require_once plugin_dir_path(__FILE__) . 'classes/class-jse-api.php';
/* External JSE API */
require_once plugin_dir_path(__FILE__) . 'classes/class-jse-connect-api.php';

/* Dynamically Loaded If Plugin Detected */
// require_once plugin_dir_path(__FILE__) . 'classes/class-ameliabooking-actions.php';
// require_once plugin_dir_path(__FILE__) . 'classes/class-forminator-actions.php';
// require_once plugin_dir_path(__FILE__) . 'classes/class-woocommerce-actions.php';


add_action( 'init', function() {
  $assets_url = plugin_dir_url( __FILE__ );
  //Setup menu
  if( is_admin() ){
    new JSECNCT_Menu( $assets_url );
  }
});

add_action( 'rest_api_init', function() {
  //Setup Wordpress REST API
  //debug: is_admin()
  $api = new JSECNCT_WP_API();
  $api->add_routes();
});

function jsecnct_initialize() {

  $integrations = JSECNCT_Settings::$integrations;
  $settings =  JSECNCT_Settings::get_settings();
  $available = JSECNCT_Settings::available();

  foreach ( $available as $key ) {
    require_once plugin_dir_path(__FILE__) . $integrations[$key]['php_file'];
    $phpType = $integrations[$key]['php_type'];
    new $phpType($settings['connection'], $settings[$key]);
    jsecnct_file_debug("Activated:", $key);
  }

};

add_action('plugins_loaded', 'jsecnct_initialize');
add_action('admin_init', 'jsecnct_initialize');
