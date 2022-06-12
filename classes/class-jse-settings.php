<?php
class JSECNCT_Settings {

  /**
   * Save Key For Settings
   */
  protected static $option_key = '_jsecnct_settings';

  /**
   * Supported Integrations
   */
  public static $integrations = [
    'amelia' => [
      'name' => 'Amelia',
      'php_file' => 'classes/class-ameliabooking-actions.php',
      'php_type' => 'JSECNCT_AmeliaBooking_Actions',
      'plugin_test' => 'ameliabooking/ameliabooking.php',
      'class_test' => 'AmeliaBooking\Domain\Entity\User\Customer'
    ],
    'forminator' => [
      'name' => 'Forminator',
      'php_file' => 'classes/class-forminator-actions.php',
      'php_type' => 'JSECNCT_Forminator_Actions',
      'plugin_test' => 'forminator/forminator.php',
      'class_test' => 'Forminator' // no namespace
    ],
    'woocommerce' => [
      'name' => 'WooCommerce',
      'php_file' => 'classes/class-woocommerce-actions.php',
      'php_type' => 'JSECNCT_Woocommerce_Actions',
      'plugin_test' => 'woocommerce/woocommerce.php',
      'class_test' => 'WooCommerce' // no namespace
    ]
  ];

  /**
   * Default Settings Structure
   */
  protected static function defaults() {
    $defaults = ['connection' => false];
    foreach ( JSECNCT_Settings::$integrations as $key => $integration ) {
      $defaults[$key] = ['active' => false];
    }
    return $defaults;
  }

  public static function available() {
    $check_plugin = function_exists('is_plugin_active');
    $avail = [];
    foreach ( JSECNCT_Settings::$integrations as $key => $integration ) {
      if( ($check_plugin && is_plugin_active($integration['plugin_test'])) || (class_exists($integration['class_test'])) ) {
        array_push($avail, $key);
      }
    }
    return $avail;
  }

  /**
   * Get saved settings
   *
   * @return array
   */
  public static function get_settings() {
    $saved = is_multisite() ? get_blog_option(0, self::$option_key, array() ) : get_option( self::$option_key, array() );
    //file_put_contents("/tmp/jse-plugin.log", "GetSettings(): ".json_encode($saved)."\n", FILE_APPEND | LOCK_EX);
    $defaults = JSECNCT_Settings::defaults();
    if( ! is_array( $saved ) || empty( $saved ) ) {
      return $defaults;
    }
    return wp_parse_args( $saved, $defaults );
  }

  /**
   * Save Settings To DB Options
   * Array keys must be part of integration set.
   *
   * @param array $settings
   */
  public static function save_settings( array $settings ) {
    //remove any non-allowed indexes before save
    $defaults = JSECNCT_Settings::defaults();
    foreach ( $settings as $i => $setting ){
      //file_put_contents("/tmp/jse-plugin.log", "DATA: ".$i." --> ".json_encode($setting)."\n", FILE_APPEND | LOCK_EX);
      if( ! array_key_exists( $i, $defaults ) ) {
        unset( $settings[ $i ] );
      }
    }
    is_multisite() ? update_blog_option(0, self::$option_key, $settings) : update_option( self::$option_key, $settings );
  }

  public static function clear_settings() {
    is_multisite() ? update_blog_option(0, self::$option_key, $defaults) : update_option( self::$option_key, $defaults );
  }
}