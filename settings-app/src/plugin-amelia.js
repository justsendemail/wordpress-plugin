import React, {useState, useEffect} from "react";
import { usePromiseTracker } from "react-promise-tracker";

const AmeliaIntegration = ({available, settings, updateSettings, lists}) => {

  let { promiseInProgress } = usePromiseTracker();
  const [mapping, setMapping] = useState(false);
  useEffect(() => {
    if(settings.mapping) setMapping(settings.mapping);
  },[settings])
  useEffect(async () => {
    if(mapping) updateSettings({...settings, mapping});
  },[mapping])

  const [resTypes, setResTypes] = useState([
    {
      key: "event",
      name: "Event",
      fields: [
        {key: "firstName", name: "First Name"},
        {key: "lastName", name: "Last Name"},
        {key: "phone", name: "Phone Number"},
        {key: "birthday", name: "Birthday"},
        {key: "gender", name: "Gender"},
        {key: "status", name: "Reservation Status"},
        {key: "persons", name: "Number of People"},
        {key: "location", name: "Location"}
      ]
    },
    {
      key: "appointment",
      name: "Appointment",
      fields: [
        {key: "firstName", name: "First Name"},
        {key: "lastName", name: "Last Name"},
        {key: "phone", name: "Phone Number"},
        {key: "birthday", name: "Birthday"},
        {key: "gender", name: "Gender"},
        {key: "status", name: "Reservation Status"},
        {key: "startDate", name: "Start Date"},
        {key: "endDate", name: "End Date"},
        {key: "zoomMeeting", name: "Zoom Meeting"},
        {key: "location", name: "Location"}
      ]
    },
  ]);

  const getResTypeName = (resType) => {
    return resType.name;
  }

  const updateResTypeList = (resType, listId) => {
    //console.log("Selected ResType: "+resType+" And ListID: "+listId);
    let newMapping;
    if(listId == 0) {
      const {[resType]: removed, ...other} = mapping;
      newMapping = other;
    } else {
      const list = lists.find(l => l.id == listId);
      newMapping = {...mapping, [resType]: {list, fmap: {}}}
    }
    // TODO: detect previous mapping and reconcile
    setMapping(newMapping);
  }

  const valueForList = (resType) => {
    const v = mapping[resType]?.list.id;
    return v ? v : '0';
  }

  const updateResTypeMapping = (resType, fieldKey, fieldName) => {
    //console.log("Map "+resType+" key: "+fieldKey+" field: "+fieldName);
    const _fmap = mapping[resType].fmap;
    if(fieldName == 0)
      delete _fmap[fieldKey];
    else
      _fmap[fieldKey] = fieldName;
    setMapping({
      ...mapping,
      [resType]: {
        ...mapping[resType],
        fmap: _fmap
      }
    });
  }

  const valueForMapping = (resType, fieldKey) => {
    const v = mapping[resType]?.fmap[fieldKey];
    return v ? v : '0';
  }

  const emailMapped = (resType) => {
    return mapping[resType]?.fmap ? Object.values(mapping[resType].fmap).includes('Email') : false;
  }

  const has = (o, k) => o.hasOwnProperty(k);

  return (
    <>
    <div className="jse-information">
      <div className={`jse-title`}>Amelia Events &amp; Appointments
      {available ? 
        <div className={`jse-activate-input`}>
          Activate: &nbsp;
          <label className="jse-switch">
            <input disabled={!available} type="checkbox" id="amelia-active" name="amelia-active"
                   checked={settings.active}
                   onChange={() => updateSettings({...settings, active: !settings.active})}
            />
            <span className="jse-slider"/>
         </label>
       </div>
      : !promiseInProgress ? " ( Install and Activate Amelia Bookings! )" : <div style={{float: 'right'}}>... Loading ...</div>}
      </div>
      <p>
        When a customer registers for an event, or books an appointment, this integration can create or
        update the customer in a JustSend.Email list. Email and Name are automatically mapped and used
        when the contact is created in the list. Additional customer fields like phone number and location
        can optionally be mapped into custom fields in the JustSend.Email system.
      </p>
    </div>
    <div className={`jse-block ${available ? "available" : ""}`}>
      <table className="jse-list-selection">
        <thead>
          <tr>
            <td>Booking Type</td><td>Select A List</td>
          </tr>
        </thead>
        <tbody>
        {resTypes.map( (resType, idx) => 
          <>
          <tr className="form-head"> 
            <td>{getResTypeName(resType)}</td>
            <td style={{position: "relative"}}>
              <select name={`jse-list-${resType.key}`}
                      onChange={(e) => updateResTypeList(resType.key, e.target.value)}
                      value={valueForList(resType.key)}>
                <option key={`${resType.key}-zero`} value="0">--Choose A List--</option>
                {lists.map((list) => (
                  <option key={`${resType.key}-${list.id}`} value={list.id}>{list.name}</option>
                ))}
              </select>
            </td>
          </tr>
          {has(mapping, resType.key) ? 
          <>
          <tr className="field-head">
            <td>Ameila Field Name</td><td>JustSend.Email Field</td>
          </tr>
          {resType.fields.map((rf) => {
            if(!has(mapping, resType.key)) return "";
            const value = valueForMapping(resType.key, rf.key);
            const avail = mapping[resType.key].list.fields
                .filter((f) => {
                  if(f.name == 'Email') return false;
                  return ( ! (
                    Object.values(mapping[resType.key].fmap).includes(f.name) 
                    && f.name != value
                  )
                )});

            return (
              <tr className="jse-bb">
                <td>{rf.name}</td>
                <td>
                  <select key={`select-${resType.key}-${rf.key}`} 
                          name={`select-${resType.key}-${rf.key}`}
                          onChange={(e) => updateResTypeMapping(resType.key, rf.key, e.target.value)}
                          value={value}
                          disabled={avail.length == 0}>
                    <option key={`${resType.key}-${rf.key}-zero`} value="0">
                      {value !== '0' ? "--Remove Mapping--" : (avail.length ? "--Not Mapped--" : "--All Fields Mapped--") }
                    </option> 
                    {avail.map((f) => (
                      <option key={`${resType.key}-${rf.key}-${f.name}`} value={f.name}>{f.name} ({f.type})</option>
                    ))}
                  </select>
                </td>
              </tr>
            )
          })}
          {(idx+1)<resTypes.length ? 
          <tr className="thead">
            <td>Booking Type</td><td>Select A List</td>
          </tr> : ""}
          </> 
          : ""}
          </> 
        )}
        </tbody>
      </table>
    </div>
    </>
  );
};
export default AmeliaIntegration;
