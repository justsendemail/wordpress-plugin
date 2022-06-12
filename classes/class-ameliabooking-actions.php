<?php

/*
 * Maybe in the future I'll use the objects are query the database directly.
 * For now all the information needed is passed in as a parameter so we can save the work.  
 */
//use AmeliaBooking\Domain\Entity\User\Customer;
//use AmeliaBooking\Infrastructure\Repository\User\UserRepository;

class JSECNCT_AmeliaBooking_Actions
{
  private $conn;
  private $conf;

  public function __construct($connection, $config) {
    $this->conn = $connection;
    $this->conf = $config;
    // add the hook if active
    if($config['active']) {
      $hook_to = 'AmeliaBookingAdded';
      $prioriy = 4242;
      $num_of_arg = 3;
      add_action($hook_to, array($this, 'jsecnct_new_booking_add_contact'), $prioriy, $num_of_arg);
    }
  }

  public function jsecnct_new_booking_add_contact($reservation, $bookings, $container) {

    if(!isset($this->conn["apiKey"])) {
      jsecnct_file_error("JSE apiKey Not In Connection Object.");
      return;
    }
    if(!isset($this->conf['mapping'])) {
      jsecnct_file_error("JSE mapping Not In Forminator Settings.");
      return;
    }
    if(!isset($this->conf['mapping'][$reservation['type']])) {
      jsecnct_file_error("INFO: Reservation Type: ".$reservation['type']." Not Mapped... Ignoring...", false);
      return;
    }

    $api = new JSECNCT_Rest_API(JSECNCT_API_URL, $this->conn['apiKey']);

    $mapping = $this->conf['mapping'][$reservation['type']];
    $list = $mapping['list'];
    $fmap = $mapping['fmap'];

    /** @var UserRepository $userRepository */
    //$userRepository = $container->get('domain.users.repository');

    foreach($bookings as $booking) {

      $booking = json_decode(json_encode($booking));

      jsecnct_file_debug("_NewBooking_ Amelia (booking): ", $booking);

      /** @var Customer $customer */
      $customer = $booking->customer; //userRepository->getById($booking['customerId']);
      $req = (object) [
        'listId' => $list['id']
      ];
      $req->email = $customer->email;
      $req->name = $customer->firstName." ".$customer->lastName;

      if($fmap) {
        if(!isset($req->custom)) {
          $req->custom = array();
        }
        foreach($fmap as $key => $jse_f) {
          $v = null;
          switch ($key) {
            case "firstName":
              $v = $customer->firstName;
              break;
            case "lastName":
              $v = $customer->lastName;
              break;
            case "phone":
              $v = isset($customer->countryPhoneIso) ? '+'.$customer->countryPhoneIso.' ' : '';
              $v .= $customer->phone;
              break;
            case "birthday":
              $v = isset($customer->birthday) ? substr($customer->birthday->date,0,10) : null;
              break;
            case "gender":
              $v = $customer->gender;
              break;
            case "status":
              $v = $reservation['status'];
              break;
            case "persons":
              $v = $booking->persons;
              break;
            case "location":
              $v = $booking->customLocation ? $booking->customLocation : $booking->location;
              break;
            case "startDate":
              $v = $reservation['bookingStart'];
              break;
            case "endDate":
              $v = $reservation['bookingEnd'];
              break;
            case "zoomMeeting":
              $v = $reservation['zoomMeeting'];
              break;
            default:
            jsecnct_file_debug("Unknown Amelia Field Key: ", $key);
          }
          if($v) {
            jsecnct_file_debug("_NewBooking_ Amelia (loop.v): ", $v);
            $cf = (object) [
              'name' => $jse_f,
              'value' => is_string($v) ? $v : json_encode($v)
            ];
            array_push($req->custom, $cf);
          }
        }
      }
      jsecnct_file_debug("AmeilaAction(REQ): ", $req);
      $res = $api->add_contact($req);
      jsecnct_file_debug("AmeilaAction(RES): ", $res);
    }
  }

  /*
     
     ####
     # Event Field Mapping
     ####
     "First Name"         --> "firstName" --> "customer.firstName"
     "Last Name"          --> "lastName"  --> "customer.lastName"
     "Phone Number"       --> "phone"     --> "customer.phone"
     "Birthday"           --> "birthday"  --> "customer.birthday.date"
     "Gender"             --> "gender"    --> "customer.gender"
     "Reservation Status" --> "status"    --> "reservation.status"
     "Number of People"   --> "persons"   --> "booking.persons",
     "Location"           --> "location"  --> "reservation.location" || "reservation.customLocation"
   
     ####
     # Appointment Field Mapping
     ####
     "First Name"         --> "firstName" --> "customer.firstName"
     "Last Name"          --> "lastName"  --> "customer.lastName"
     "Phone Number"       --> "phone"     --> "customer.phone"
     "Birthday"           --> "birthday"  --> "customer.birthday.date"
     "Gender"             --> "gender"    --> "customer.gender"
     "Reservation Status" --> "status"    --> "reservation.status"
     "Start Date"         --> "startDate" --> "reservation.bookingStart",
     "End Date"           --> "endDate"   --> "reservation.bookingEnd",
     "Zooming Meeting"    --> "zoomMeeting"  --> "reservation.zoomMeeting"
     "Location"           --> "location"  --> "reservation.location"
   */
   
}
