<?php

class JSECNCT_WP_API {
    /**
     * Add routes
     */
    public function add_routes( ) {
        register_rest_route( 'jsecnct-api/v1', '/settings',
            array(
                'methods'         => 'POST',
                'callback'        => array( $this, 'update_settings' ),
                'args' => array(
                    'industry' => array(
                        'type' => 'string',
                        'required' => false,
                        'sanitize_callback' => 'sanitize_text_field'
                    ),
                    'amount' => array(
                        'type' => 'integer',
                        'required' => false,
                        'sanitize_callback' => 'absint'
                    )
                ),
                'permission_callback' => array( $this, 'permissions' )
            )
        );
        register_rest_route( 'jsecnct-api/v1', '/settings',
            array(
                'methods'         => 'GET',
                'callback'        => array( $this, 'get_settings' ),
                'args'            => array(
                ),
                'permission_callback' => array( $this, 'permissions' )
            )
        );
        register_rest_route( 'jsecnct-api/v1', '/integrations',
            array(
                'methods'         => 'GET',
                'callback'        => array( $this, 'get_integrations' ),
                'args'            => array(
                ),
                'permission_callback' => array( $this, 'permissions' )
            )
        );
        register_rest_route( 'jsecnct-api/v1', '/forminator',
            array(
                'methods'         => 'GET',
                'callback'        => array( $this, 'get_forminator' ),
                'args'            => array(
                ),
                'permission_callback' => array( $this, 'permissions' )
            )
        );
        register_rest_route( 'jsecnct-api/v1', '/formidable',
            array(
                'methods'         => 'GET',
                'callback'        => array( $this, 'get_formidable' ),
                'args'            => array(
                ),
                'permission_callback' => array( $this, 'permissions' )
           )
        );
    }

    /**
     * Check request permissions
     *
     * @return bool
     */
    public function permissions(){
        return current_user_can( 'manage_options' );
    }

    /**
     * Update settings
     *
     * @param WP_REST_Request $request
     */
    public function update_settings( WP_REST_Request $request ){
        $settings = json_decode($request->get_body(), true);

        JSECNCT_Settings::save_settings( $settings );
        $response = rest_ensure_response( JSECNCT_Settings::get_settings() );
        $response->set_status( 201 );
        return $response;
    }

    /**
     * Get settings via API
     *
     * @param WP_REST_Request $request
     */
    public function get_settings( WP_REST_Request $request ){
        return rest_ensure_response( JSECNCT_Settings::get_settings());
    }

    public function get_integrations( WP_REST_Request $request ) {

        // $response = (object) [
        //     'woocommerce' => is_plugin_active('woocommerce/woocommerce.php'),
        //     'amelia' => is_plugin_active('ameliabooking/ameliabooking.php'),
        //     'forminator' => is_plugin_active('forminator/forminator.php')
        // ];
        // return rest_ensure_response( $response );
        $avail_integrations = JSECNCT_Settings::$integrations;
        foreach(JSECNCT_Settings::available() as $available) {
          if(isset($avail_integrations[$available]))
            $avail_integrations[$available]['available'] = true;
        }
        return rest_ensure_response( (object) $avail_integrations );
    }

    /**
     * Return information about the forminator configuration in this wordpress so
     * we can display a configuration to map forms to marketing lists.
     * @param WP_REST_Request $request
     */
    public function get_forminator( WP_REST_Request $request ) {
      $response = new StdClass();
      $response->forms = Forminator_API::get_forms();
      foreach($response->forms as $form) {
        $form->wrappers = Forminator_API::get_form_wrappers($form->id);
        //file_put_contents("/tmp/jse-plugin.log", "FORM: ".json_encode($form, JSON_PRETTY_PRINT)."\n", FILE_APPEND | LOCK_EX);
      }
      return rest_ensure_response( $response );
    }

  /**
   * Return information about the formidable configuration in this wordpress so
   * we can display a configuration to map forms to marketing lists.
   * @param WP_REST_Request $request
   */
  public function get_formidable( WP_REST_Request $request ) {
    $response = new StdClass();
    $response->forms = FrmForm::get_published_forms();
    foreach($response->forms as $form) {
      $form->fields = FrmField::get_all_for_form($form->id);
    }
    return rest_ensure_response( $response );
  }
}