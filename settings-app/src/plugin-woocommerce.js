import React, {useState, useEffect} from "react";
import { usePromiseTracker } from "react-promise-tracker";

const WooCommerceIntegration = ({available, settings, updateSettings, lists}) => {

  let { promiseInProgress } = usePromiseTracker();
  const [mapping, setMapping] = useState(false);
  useEffect(() => {
    if(settings.mapping) setMapping(settings.mapping);
  },[settings])
  useEffect(async () => {
    if(mapping) updateSettings({...settings, mapping});
  },[mapping])

  const [wooTypes, setWooTypes] = useState([
    {
      key: "order",
      name: "On Order",
      fields: [
        {key: "firstName", name: "First Name"},
        {key: "lastName", name: "Last Name"},
        {key: "company", name: "Company"},
        {key: "phone", name: "Phone Number"},
        {key: "total", name: "Order Total"}
      ]
    }
  ]);

  const getWooTypeName = (wooType) => {
    return wooType.name;
  }

  const updateWooTypeList = (wooType, listId) => {
    let newMapping;
    if(listId == 0) {
      const {[wooType]: removed, ...other} = mapping;
      newMapping = other;
    } else {
      const list = lists.find(l => l.id == listId);
      newMapping = {...mapping, [wooType]: {list, fmap: {}}}
    }
    // TODO: detect previous mapping and reconcile
    setMapping(newMapping);
  }

  const valueForList = (wooType) => {
    const v = mapping[wooType]?.list.id;
    return v ? v : '0';
  }

  const updateWooTypeMapping = (wooType, fieldKey, fieldName) => {
    const _fmap = mapping[wooType].fmap;
    if(fieldName == 0)
      delete _fmap[fieldKey];
    else
      _fmap[fieldKey] = fieldName;
    setMapping({
      ...mapping,
      [wooType]: {
        ...mapping[wooType],
        fmap: _fmap
      }
    });
  }

  const valueForMapping = (wooType, fieldKey) => {
    const v = mapping[wooType]?.fmap[fieldKey];
    return v ? v : '0';
  }

  const emailMapped = (wooType) => {
    return mapping[wooType]?.fmap ? Object.values(mapping[wooType].fmap).includes('Email') : false;
  }

  const has = (o, k) => o.hasOwnProperty(k);

  return (
    <>
    <div className="jse-information">
      <div className={`jse-title`}>WooCommerce Order Integration
      {available ? 
        <div className={`jse-activate-input`}>
          Activate: &nbsp;
          <label className="jse-switch">
            <input disabled={!available} type="checkbox" id="woo-active" name="woo-active"
                   checked={settings.active}
                   onChange={() => updateSettings({...settings, active: !settings.active})}
            />
            <span className="jse-slider"/>
         </label>
       </div>
      : !promiseInProgress ? " ( Install and Activate WooCommerce! )" : <div style={{float: 'right'}}>... Loading ...</div>}
      </div>
      <p>
        Any time an order is completed on WooCommerce this integration will create or update the customer
        information in a JustSend.Email list. Basic customer information of First Name, Last Name, and Company
        can optionally be mapped into custom fields in the JustSend.Email system. The total for the order as
        well as the historical total for the customer are also available to use in marketing efforts.
      </p>
    </div>
    <div className={`jse-block ${available ? "available" : ""}`}>
      <table className="jse-list-selection">
        <thead>
          <tr>
            <td>Customer Event</td><td>Select A List</td>
          </tr>
        </thead>
        <tbody>
        {wooTypes.map( (wooType, idx) => 
        <>
        <tr class="form-head">
          <td>{getWooTypeName(wooType)}</td>
          <td>
            <select name={`jse-list-${wooType.key}`} 
                    onChange={(e) => updateWooTypeList(wooType.key, e.target.value)}
                    value={valueForList(wooType.key)}>
              <option key={`${wooType.key}-zero`} value="0">--Choose A List--</option>
              {lists.map((list) => (
                <option key={`${wooType.key}-${list.id}`} value={list.id}>{list.name}</option>
              ))}
            </select>
          </td>
        </tr>
        {has(mapping, wooType.key) ?
        <>
        <tr className="field-head">
          <td>WooCommerce Field Name</td><td>JustSend.Email Field</td>
        </tr>
        {wooType.fields.map((of) => {
          if(!has(mapping, wooType.key)) return "";
          const value = valueForMapping(wooType.key, of.key);
          const avail = mapping[wooType.key].list.fields
              .filter((f) => {
                if(f.name == 'Email') return false;
                return ( ! (
                  Object.values(mapping[wooType.key].fmap).includes(f.name) 
                  && f.name != value
                )
              )});
              return (
                <tr className="jse-bb">
                  <td>{of.name}</td>
                  <td>
                  <select key={`select-${wooType.key}-${of.key}`} 
                          name={`select-${wooType.key}-${of.key}`}
                          onChange={(e) => updateWooTypeMapping(wooType.key, of.key, e.target.value)}
                          value={value}
                          disabled={avail.length == 0}>
                    <option key={`${wooType.key}-${of.key}-zero`} value="0">
                      {value !== '0' ? "--Remove Mapping--" : (avail.length ? "--Not Mapped--" : "--All Fields Mapped--") }
                    </option> 
                    {avail.map((f) => (
                      <option key={`${wooType.key}-${of.key}-${f.name}`} value={f.name}>{f.name} ({f.type})</option>
                    ))}
                  </select>
                  </td>
                </tr>)
              })}
              {(idx+1)<wooTypes.length ? 
              <tr className="thead">
                <td>Customer Event</td><td>Select A List</td>
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
export default WooCommerceIntegration;