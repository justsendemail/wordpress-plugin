<?php

class JSECNCT_Woocommerce_Actions
{
  private $conn;
  private $conf;

  public function __construct($connection, $config) {
    $this->conn = $connection;
    $this->conf = $config;
    // add the hook if active
    if($config['active']) {
      $hook_to = 'woocommerce_new_order';
      $prioriy = 111;
      $num_of_arg = 1;
      add_action($hook_to, array($this, 'jsecnct_order_update_contact'), $prioriy, $num_of_arg);
    }
  }

  public function jsecnct_order_update_contact($order_id) {

    if(!isset($this->conn["apiKey"])) {
      jsecnct_file_error("JSE apiKey Not In Connection Object.");
      return;
    }
    if(!isset($this->conf['mapping'])) {
      jsecnct_file_error("JSE mapping Not In Forminator Settings.");
      return;
    }
    if(!isset($this->conf['mapping']['order'])) {
      jsecnct_file_error("INFO: WooCommerce Order Not Mapped... Ignoring...");
      return;
    }

    $api = new JSECNCT_Rest_API(JSECNCT_API_URL, $this->conn['apiKey']);

    jsecnct_file_debug("ORDER_ID: ", $order_id);
    $order = wc_get_order( $order_id );
    jsecnct_file_debug("DATA: ", $order->get_data());

    $mapping = $this->conf['mapping']['order'];
    $list = $mapping['list'];
    $fmap = $mapping['fmap'];

    $req = (object) [
      'listId' => $list['id']
    ];
    $req->email = $order->get_billing_email();
    $req->name = $order->get_billing_first_name()." ".$order->get_billing_last_name();

    if($fmap) {
      if(!isset($req->custom)) {
        $req->custom = array();
      }
      foreach($fmap as $key => $jse_f) {
        $v = null;
        switch ($key) {
          case "firstName":
            $v = $order->get_billing_first_name();
            break;
          case "lastName":
            $v = $order->get_billing_last_name();
            break;
          case "company":
            $v = $order->get_billing_company();
            break;
          case "phone":
            $v = $order->get_billing_phone();
            break;
          case "total":
            $v = $order->get_total();
            break;
          default:
            jsecnct_file_error("Unknown WooCommerce Field Key:", $key);  
        }
        if($v) {
          $cf = (object) [
            'name' => $jse_f,
            'value' => is_string($v) ? $v : json_encode($v)
          ];
          array_push($req->custom, $cf);
        }
      }
    }

    jsecnct_file_debug("WooCommerceAction(REQ): ", $req);
    $res = $api->add_contact($req);
    jsecnct_file_debug("WooCommerceAction(RES): ", $res);

  }

}
