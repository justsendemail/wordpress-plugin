<?php

class JSECNCT_Rest_API {

  const CLIENT     = 'jse/client';
  const CONTACT    = 'jse/contact';
  const LISTS      = 'jse/lists';
  const LIST       = 'jse/list';

  private $base_url;
  private $api_key;

  public function __construct( $base_url, $api_key ) {
    $this->base_url = trim( strval( $base_url ) );
    $this->api_key  = trim( strval( $api_key ) );
  }

  private function get_endpoint_url( $endpoint ) {
    return sprintf( '%s%s', trailingslashit( $this->base_url ), $endpoint );
  }

  /**
   * @param $endpoint
   * @param array $args
   *
   * @return string|WP_Error Response body or WP_Error
   */
  private function make_request( $endpoint, $args, $verb = 'POST' ) {

    if(!isset($args)) $args = new stdClass();
    $url = $this->get_endpoint_url( $endpoint );

    if ( 'GET' === $verb ) {
      $response = wp_remote_get(
        $url,
        array(
          'timeout' => 10,
          'headers' => array(
            'JSE-API-KEY' => $this->api_key
          )
        )
      );
    } else {
      $response = wp_remote_post(
        $url,
        array(
          'timeout'   => 10,
          'headers'   => array(
            'Content-Type' => 'application/json',
            'JSE-API-KEY'  => $this->api_key
          ),
          'body'      => json_encode($args)
        )
      );
    }

    if (is_wp_error( $response ) || wp_remote_retrieve_response_code( $response ) > 200) {
      return new WP_Error('remote_error', esc_html__( 'Failed To Communication With The JustSend.Email System!', 'jsecnct' ));
    }

    return wp_remote_retrieve_body( $response );
  }

  public function get_client() {
    $response = $this->make_request( self::CLIENT );
  }

  public function add_contact($data) {
    if ( empty( $data ) || ! isset( $data->{'listId'} )) {
      return new WP_Error( 'invalid_data', __( 'No listId In JSE Request', 'jsecnct' ) );
    }
    $response = $this->make_request( self::CONTACT, $data );
    if ( ! is_wp_error( $response ) ) {
      return $response;
    }
    return new WP_Error( 'remote_error', json_decode($response)->error );
  }

  //TODO: public function get_contact_count($list_id) {}

  //TODO: public function contact_status( $list_id, $email ) {}

  public static function validate_api_credentials( $base_url, $api_key ) {
    $jse = new JSECNCT_Rest_API($base_url, $api_key);
    return $jse->get_client_details();
  }
}