<?php


/*
 */
class JSECNCT_Formidable_Actions {

  private $conn;
  private $conf;

  public function __construct($connection, $config) {
    $this->conn = $connection;
    $this->conf = $config;
    // add the hook if active
    if($config['active']) {
      $hook_to = 'frm_after_create_entry'; // TODO: updates... 'frm_after_update_entry'
      $prioriy = 111;
      $num_of_arg = 2;
      add_action($hook_to, array($this, 'jsecnct_new_form_entry_add_contact'), $prioriy, $num_of_arg);
    }
  }

  public function jsecnct_new_form_entry_add_contact($entry_id, $form_id) {

    if(!isset($this->conn["apiKey"])) {
      jsecnct_file_error("JSE apiKey Not In Connection Object.");
      return;
    }
    if(!isset($this->conf['mapping'])) {
      jsecnct_file_error("JSE mapping Not In Formidable Settings.");
      return;
    }
    if(!isset($this->conf['mapping'][$form_id])) {
      jsecnct_file_error("INFO: FormiableID: ".$form_id." Not Mapped... Ignoring...", false);
      return;
    }
    $api = new JSECNCT_Rest_API(JSECNCT_API_URL, $this->conn['apiKey']);

    /*
     * The key or index is the field.id in Formidable
     *  {
     *       "1":"John",
     *       "2":"Smith",
     *       "3":"john.smith@justsend.email",
     *       "6":"This One",
     *       "7":["Option Two","Other Option"],
     *   }
     */
    $raw_form_data = json_decode(json_encode($_POST['item_meta']), true);
    // I need this form structure to get field names and keys as only the data is in the 'item_meta'
    $form_fields = FrmField::get_all_for_form($form_id);
    // The mapping is field_key --> JSE_Field so I need to re-key the
    // raw form data into an array where 'field_key' -> 'data'
    $form_field_data = $this->re_key_form_data($raw_form_data, $form_fields);
    $mapping = $this->conf['mapping'][$form_id];

//    jsecnct_file_debug("RAW Form Data:     ", $raw_form_data);
//    jsecnct_file_debug("Forms Fields:      ", $form_fields);
//    jsecnct_file_debug("Form Field Data:   ", $form_field_data);
//    jsecnct_file_debug("Mapping: (JSE)     ", $mapping);

    $raw_fields = $this->build_raw_form_fields($form_field_data);
//    jsecnct_file_debug("RAW Fields: (JSE)  ", $raw_fields);

    /*
     * Now we have the field_key --> field_value necessary to process the
     * mapping and build the JSE request to add the contact.
     * {
     *   "qh4icy": "John",
     *   "ocfup1": "Smith",
     *   "29yf4d": "john.smith@justsend.email",
     *   "7qtj": "This One",
     *   "iho6t": "Option One, New Option",
     *   "e6lis6": "Subject Here",
     *   "9jv0r1": "Message Here"
     * }
     */

    $list = $mapping['list'];
    $fmap = $mapping['fmap'];

    $req = (object) [
      'listId' => $list['id']
    ];

    foreach($fmap as $field_key => $jse_f) {
      $v = $raw_fields[$field_key];
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

  public function re_key_form_data($raw_form_data, $form_fields) {
    $fieldByKey = array();
    $fieldByID = array();
    foreach($form_fields as $field) {
      $fieldByKey[$field->field_key] = $field;
      $fieldByID[$field->id] = $field;
    }
    foreach($raw_form_data as $field_id => $value) {
      if(array_key_exists($field_id, $fieldByID)) {
        $fieldByID[$field_id]->value = $value;
      }
    }
    return $fieldByKey;
  }

  /**
   * Results in fieldKey --> {field} object
   *                           field->value
   *                           field->key ... etc
   * @param $form_data
   * @return array
   */
  public function build_raw_form_fields($form_field_data) {

    $fields = array();

    foreach($form_field_data as $key => $field) {

      $value = $field->value;
      if(is_string($value)) {
        // simple string value... pass it through
        $fields[$key] = $value;
      } elseif(is_iterable($value)) {
        $fields[$key] = join("|", $value);
      }

    }

    return $fields;
  }

}
