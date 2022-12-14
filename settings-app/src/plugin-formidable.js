import React, {useState, useEffect} from "react";
import { usePromiseTracker } from "react-promise-tracker";

import { API } from './client'

const FormidableIntegration = ({available, settings, updateSettings, lists}) => {

  let { promiseInProgress } = usePromiseTracker();
  const [mapping, setMapping] = useState(false);
  useEffect(() => {
    if(settings.mapping) setMapping(settings.mapping);
  },[settings]);
  useEffect(async () => {
    if(mapping) updateSettings({...settings, mapping});
  },[mapping]);
  
  // Formidable Forms Grab
  const [forms, setForms] = useState([]);
  useEffect(async () => {
    const resp = await API.wpClient('formidable');
    if(resp.forms) setForms(resp.forms);
  }, []);

  const getFormName = (form) => {
    return form.name
  };

  const updateFormList = (formId, listId) => {
    //console.log("Formidable... UpdateFormList: "+formId+" --> "+listId);
    // Remove mapping for form indicated by a '0' or no listId parameter
    if(!listId || listId === '0') {
      const {[formId]: removed, ...other} = mapping;
      setMapping(other);
      return;
    }
    // grab our list by id.
    const list = lists.find(l => l.id === listId);
    if(!list) {
      console.error("ERROR... ListID: "+listId+" Not Found!", list);
      return;
    }
    // Grab the previous mapping... if it exists
    const map = mapping[formId];
    // If the formId has no mapping assign an empty start
    if(!map) {
      //console.log("Assigning FormID: "+formId+" --> ListID: "+listId);
      setMapping({...mapping, [formId]: {list, fmap: {}}});
      return;
    }
    // Reconcile the previous mapping and list if needed.
    if(map && map.list && map.fmap && Object.keys(map.fmap).length > 0) {
      const listDiffers = (JSON.stringify(list) !== JSON.stringify(map.list));
      if(listDiffers) {
        const fields = list.fields.map(f => f.name);
        const fmap = Object.fromEntries(Object.entries(map.fmap).filter(([key, value]) => fields.includes(value)));
        //console.log("Old fmap: ", map.fmap);
        //console.log("New fmap: ", fmap);
        setMapping({...mapping, [formId]: {list, fmap}});
        return;
      }
    }
    //console.log("No Changes In FormID: "+formId+" Mapping");
  };

  const valueForList = (formId) => {
    const v = mapping[formId]?.list.id;
    return v ? v : '0';
  }

  const updateFormMapping = (formId, fieldKey, jseFieldName) => {
    //console.log("Map "+formId+" fieldKey: "+fieldKey+" jseField: "+jseFieldName);
    const _fmap = mapping[formId].fmap;
    if(jseFieldName === '0')
      delete _fmap[fieldKey];
    else
      _fmap[fieldKey] = jseFieldName;
    setMapping({
      ...mapping,
      [formId]: {
        ...mapping[formId],
        fmap: _fmap
      }
    });
  }

  const valueForMapping = (formId, fieldKey) => {
    const v = mapping[formId]?.fmap[fieldKey];
    return v ? v : '0';
  }

  const emailMapped = (formId) => {
    return mapping[formId]?.fmap ? Object.values(mapping[formId].fmap).includes('Email') : false;
  }

  const has = (o, k) => o.hasOwnProperty(k);

  const [freshened, setFreshened] = useState(false);
  const freshenLists = () => {
    if(freshened || !mapping || lists.length === 0) return;
    setFreshened(true);
    for(const formId in mapping) {
      //console.log("Attempt To Freshen List For Mapping: ", mapping[formId]);
      updateFormList(formId, mapping[formId].list?.id);
    }
  }
  freshenLists();

  return (
    <>
    <div className="jse-information">
      <div className={`jse-title`}>Formidable Forms Integration
      {available ? 
        <div className={`jse-activate-input`}>
          Activate: &nbsp;
          <label className="jse-switch">
            <input disabled={!available} type="checkbox" id="formidable-active" name="formidable-active"
                   checked={settings.active}
                   onChange={() => updateSettings({...settings, active: !settings.active})}
            />
            <span className="jse-slider"/>
         </label>
       </div>
      : !promiseInProgress ? " ( Install and Activate Formidable! )" : <div style={{float: 'right'}}>... Loading ...</div>}
      </div>
      <p>
        Any time a form is submitted with Formidable this integration can create or update the submitter
        in a JustSend.Email list. The integration requires, at a minimum, that you capture an email address
        in the form.
      </p>
    </div>
    <div className={`jse-block ${available ? "available" : ""}`}>
      <table className="jse-list-selection">
        <thead>
          <tr>
            <td colSpan={2}>Formidable Form</td><td>Select A List</td>
          </tr>
        </thead>
        <tbody>
          {forms.map( (form, idx) => 
          <>
          {(idx>0)&&(valueForList(form.id)!=='0') ? 
          <tr className="thead">
            <td colSpan={2}>Formidable Form</td><td>Select A List</td>
          </tr> : ""}
          <tr className="form-head">
            <td colSpan={2}>{getFormName(form)}</td>
            <td style={{position: "relative"}}>
              <select name={`jse-list-${form.id}`}
                      onChange={(e) => updateFormList(form.id, e.target.value)}
                      value={valueForList(form.id)}>
                <option key={`${form.id}-zero`} value="0">--Choose A List--</option>
                {lists.map((list) => (
                  <option key={`${form.id}-${list.id}`} value={list.id}>{list.name}</option>
                ))}
              </select>
              { !emailMapped(form.id) && mapping[form.id] ? <div className="jse-error-float"><span className="jse-error">⚠️ You Must Map an Email</span></div> : ""}
            </td>
          </tr>
          {has(mapping, form.id) ? 
          <>
          <tr className="field-head">
            <td>Field Name</td><td>Field Type</td><td>JustSend.Email Field</td>
          </tr>
          {form.fields.map((ff) => {
            if(!has(mapping, form.id)) return "";
            const value = valueForMapping(form.id, ff.field_key);
            const avail = mapping[form.id].list.fields.filter((f) => ( ! (
              Object.values(mapping[form.id].fmap).includes(f.name) && f.name !== value
            )));
            return (
            <tr className="jse-bb">
              <td>{ff.name}</td>
              <td><span className="jse-text-box">{ff.type}</span></td>
              <td>
                <select key={`select-${form.id}-${ff.field_key}`}
                        name={`select-${form.id}-${ff.field_key}`}
                        onChange={(e) => updateFormMapping(form.id, ff.field_key, e.target.value)}
                        value={value}
                        disabled={avail.length === 0}>
                  <option key={`${form.id}-${ff.field_key}-zero`} value="0">
                    {value !== '0' ? "--Remove Mapping--" : (avail.length ? "--Not Mapped--" : "--All Fields Mapped--") }
                  </option> 
                  {avail.map((f) => (
                    <option key={`${form.id}-${ff.field_key}-${f.name}`} value={f.name}>{f.name} ({f.type})</option>
                  ))}
                </select>
              </td>
            </tr>)
          })}
          {(idx+1)<forms.length ? 
          <tr className="thead">
            <td colSpan={2}>Formidable Form</td><td>Select A List</td>
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
export default FormidableIntegration;
