<?php
class JSECNCT_Menu {
    /**
     * Menu slug
     *
     * @var string
     */
    protected $slug = 'jsecnct-menu';
    /**
     * URL for assets
     *
     * @var string
     */
    protected $assets_url;
    /**
     * Icon Base64 Data
     */
    protected $icon_data;

    /**
     * JSE_Settings_Menu constructor.
     *
     * @param string $assets_url URL for assets
     */
    public function __construct( $assets_url ) {
        $this->assets_url = $assets_url;
        $icon_file_path = plugin_dir_path( __FILE__ )."jsecnct-icon.svg";
        $this->icon_data = base64_encode(file_get_contents($icon_file_path));
        add_action( 'admin_menu', array( $this, 'add_page' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'register_assets' ) );
    }
    /**
     * Add submenu page
     *
     * @uses "admin_menu"
     */
    public function add_page() {

      add_menu_page(
        'JustSend.Email', 'JustSend.Email', 'manage_options', 
        $this->slug,
        array( $this, 'render_dashboard' ),
        "data:image/svg+xml;base64,".$this->icon_data
      );
      add_submenu_page($this->slug,
        'Dashboard', 'Dashboard', 'manage_options',
        $this->slug,
        array( $this, 'render_dashboard' ),
        1
      );

      $integrations = JSECNCT_Settings::$integrations;
      $available = JSECNCT_Settings::available();
      $pos = 1;
      foreach ( $available as $key ) {
        add_submenu_page($this->slug,
          $integrations[$key]['name'], $integrations[$key]['name'], 'manage_options', 'jsecnct-'.$key,
          array( $this, 'render_'.$key ), $pos++
        );
      }
    }
    /**
     * Register CSS and JS for page
     *
     * @uses "admin_enqueue_scripts" action
     */
    public function register_assets()
    {
        wp_register_script( $this->slug, $this->assets_url . 'js/index_bundle.js' );
        wp_register_style(  $this->slug, $this->assets_url . 'css/hawking.css' );
        wp_localize_script( $this->slug, '__JSECNCT', array(
            'strings' => array(
                'saved' => 'Settings Saved',
                'error' => 'Error'
            ),
            'api'     => array(
                'appAuth'   => esc_url_raw( $GLOBALS['jsecnct_authorize_endpoint'] ),
                'appUrl'    => esc_url_raw( JSECNCT_APP_URL ),
                'apiUrl'    => esc_url_raw( JSECNCT_API_URL ),
                'siteUrl'   => esc_url_raw( get_bloginfo('url') ),
                'wpApiUrl'  => esc_url_raw( rest_url( 'jsecnct-api/v1/' ) ),
                'nonce'     => wp_create_nonce( 'wp_rest' )
            )
        ) );
    }
    /**
     * Enqueue CSS and JS for page
     */
    public function enqueue_assets(){
        if( ! wp_script_is( $this->slug, 'registered' ) ){
            $this->register_assets();
        }
        wp_enqueue_script( $this->slug );
        wp_enqueue_style( $this->slug );
    }

    public function render_page($page) {
      jsecnct_file_debug("Render ", $page);
      $this->enqueue_assets();
      ?>
      <div class="wrap">
        <div id="jse-connect-plugin-app" data-page="<?php echo $page ?>" data-prefix="jsecnct"></div>
      </div>
      <div class="wrap"></div>
      <?php
    }

    /**
     * Render plugin admin page functions
     */
    public function render_dashboard() { $this->render_page("dashboard"); }
    public function render_woocommerce() { $this->render_page("woocommerce"); }
    public function render_amelia() { $this->render_page("amelia"); }
    public function render_forminator() { $this->render_page("forminator"); }
}