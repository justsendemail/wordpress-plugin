<?php


/*
 */
class JSECNCT_Forminator_Actions {

  private $conn;
  private $conf;

  public function __construct($connection, $config) {
    $this->conn = $connection;
    $this->conf = $config;
    // add the hook if active
    if($config['active']) {
      $hook_to = 'forminator_custom_form_submit_before_set_fields';
      $prioriy = 111;
      $num_of_arg = 3;
      add_action($hook_to, array($this, 'jsecnct_new_form_submit_add_contact'), $prioriy, $num_of_arg);
    }
  }

  public function jsecnct_new_form_submit_add_contact($entry, $form_id, $field_data_array) {

    if(!isset($this->conn["apiKey"])) {
      jsecnct_file_error("JSE apiKey Not In Connection Object.");
      return;
    }
    if(!isset($this->conf['mapping'])) {
      jsecnct_file_error("JSE mapping Not In Forminator Settings.");
      return;
    }
    if(!isset($this->conf['mapping'][$form_id])) {
      jsecnct_file_error("INFO: FormID: ".$form_id." Not Mapped... Ignoring...", false);
      return;
    }

    jsecnct_file_debug("FORM DATA:", $field_data_array);

    $api = new JSECNCT_Rest_API(JSECNCT_API_URL, $this->conn['apiKey']);

    $form_data = json_decode(json_encode($field_data_array), true);
    $raw_fields = $this->build_jse_fields($form_data);
    $mapping = $this->conf['mapping'][$form_id];

    jsecnct_file_debug("ForminatorAction(raw_fields)", $raw_fields);
    jsecnct_file_debug("ForminatorAction(mapping)", $mapping);

    $list = $mapping['list'];
    $fmap = $mapping['fmap'];

    $req = (object) [
      'listId' => $list['id']
    ];

    foreach($fmap as $slug => $jse_f) {
      $v = $raw_fields[$slug];
      if(strtolower($jse_f) === "email" || strtolower($jse_f) === "name")  {
        $req->{"$jse_f"} = $v;
      } else {
        if(!isset($req->custom)) $req->custom = array();
        $cf = (object) [
          'name' => $jse_f,
          'value' => is_string($v) ? $v : json_encode($v)
        ];
        array_push($req->custom, $cf);
      }
    }

    jsecnct_file_debug("JSE_add_contact(REQ)", $req);
    $res = $api->add_contact($req);
    jsecnct_file_debug("JSE_add_contact(RES)", $res);

  }

  public function build_jse_fields($form_data) {

    $fields = array();

    $has_email = false;
    $has_name = false;
    foreach($form_data as $key => $value) {

      $field_name = "";
      if(is_string($value)) {
        // simple string value... pass it through
        $fields[$key] = $value;
      } elseif(is_iterable($value)) {
        $field_name = "";
        $field_value = "";
        foreach($value as $k => $v) {
          if($k === 'name') {
            $field_name = $v;
          } elseif($k === 'value') {
            // checkbox values... leave as "array syntax"
            if(!is_iterable($v)) {
              $field_value = $v;
            } else {
              $sep = preg_match('/checkbox/i', $field_name) ? "|" : " ";
              foreach($v as $pk => $pv) {
               $field_value .= $pv.$sep;
              }
              $field_value = trim($field_value);
            }
          }
          $fields[$field_name] = $field_value;
          if($field_name === 'email') $has_email = true;
          if($field_name === 'name') $has_name = true;
          if(strpos($field_name,'user_ip') > 0) {
            $fields['ipaddress'] = $field_value;
          }
        }
      }
    }
    return $fields;
  }

}
