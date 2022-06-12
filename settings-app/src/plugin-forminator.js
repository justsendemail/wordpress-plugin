import React, {useState, useEffect} from "react";
import { usePromiseTracker } from "react-promise-tracker";

import { API } from './client'

const ForminatorIntegration = ({available, settings, updateSettings, lists}) => {

  let { promiseInProgress } = usePromiseTracker();
  const [mapping, setMapping] = useState(false);
  useEffect(() => {
    if(settings.mapping) setMapping(settings.mapping);
  },[settings])
  useEffect(async () => {
    if(mapping) updateSettings({...settings, mapping});
  },[mapping])
  
  // Forminator Forms Grab
  const [forms, setForms] = useState([]);
  useEffect(async () => {
    const resp = await API.wpClient('forminator');
    if(resp.forms) setForms(resp.forms);
  }, []);

  useEffect(async () => {
    if(forms.length) {
      forms.forEach((form) => {
        const wraps = form.wrappers;
        form.fields.forEach((f) => {
          //console.log("Field:", f);
          decorateFormWrapper(f, wraps.find(w => w.wrapper_id == f.form_id));
        })
      })
    }
  },[forms])

  const decorateFormWrapper = (f, wrapper) => {
    const d = wrapper.fields.find(wf => wf.element_id == f.slug);
    if(d?.field_label && d?.field_label?.length > 0) {
      f.label = d.field_label;
    } else {
      f.label = f.slug;
    }
    if(d.type == "name") {
      //const parts = (d.fname == "true" ? )
    }
  }

  const getFormName = (form) => {
    if(form.settings.formName) return form.settings.formName;
    if(form.settings.form_name) return form.settings.form_name;
    return form.name;
  }

  const updateFormList = (formId, listId) => {
    //console.log("Selected FormID: "+formId+" And ListID: "+listId);
    let newMapping;
    if(listId == 0) {
      const {[formId]: removed, ...other} = mapping;
      newMapping = other;
    } else {
      const list = lists.find(l => l.id == listId);
      newMapping = {...mapping, [formId]: {list, fmap: {}}}
    }
    // TODO: detect previous mapping and reconcile
    setMapping(newMapping);
  }

  const valueForList = (formId) => {
    const v = mapping[formId]?.list.id;
    return v ? v : '0';
  }

  const updateFormMapping = (formId, formSlug, fieldName) => {
    //console.log("Map "+formId+" slug: "+formSlug+" field: "+fieldName);
    const _fmap = mapping[formId].fmap;
    if(fieldName == 0)
      delete _fmap[formSlug];
    else
      _fmap[formSlug] = fieldName;
    setMapping({
      ...mapping,
      [formId]: {
        ...mapping[formId],
        fmap: _fmap
      }
    });
  }

  const valueForMapping = (formId, formSlug) => {
    const v = mapping[formId]?.fmap[formSlug];
    return v ? v : '0';
  }

  const emailMapped = (formId) => {
    return mapping[formId]?.fmap ? Object.values(mapping[formId].fmap).includes('Email') : false;
  }

  const has = (o, k) => o.hasOwnProperty(k);

  return (
    <>
    <div className="jse-information">
      <div className={`jse-title`}>Forminator Forms Integration
      {available ? 
        <div className={`jse-activate-input`}>
          Activate: &nbsp;
          <label className="jse-switch">
            <input disabled={!available} type="checkbox" id="forminator-active" name="forminator-active"
                   checked={settings.active}
                   onChange={() => updateSettings({...settings, active: !settings.active})}
            />
            <span className="jse-slider"/>
         </label>
       </div>
      : !promiseInProgress ? " ( Install and Activate Forminator! )" : <div style={{float: 'right'}}>... Loading ...</div>}
      </div>
      <p>
        Any time a form is submitted with Forminator this integration can create or update the submitter
        in a JustSend.Email list. The integration requires, at a minimum, that you capture an email address
        from
      </p>
    </div>
    <div className={`jse-block ${available ? "available" : ""}`}>
      <table className="jse-list-selection">
        <thead>
          <tr>
            <td colSpan={2}>Forminator Form</td><td>Select A List</td>
          </tr>
        </thead>
        <tbody>
          {forms.map( (form, idx) => 
          <>
          {(idx>0)&&(valueForList(form.id)!=='0') ? 
          <tr className="thead">
            <td colSpan={2}>Forminator Form</td><td>Select A List</td>
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
            <td>Field Label</td><td>Field Name</td><td>JustSend.Email Field</td>
          </tr>
          {form.fields.map((ff) => {
            if(!has(mapping, form.id)) return "";
            const value = valueForMapping(form.id, ff.slug);
            const avail = mapping[form.id].list.fields.filter((f) => ( ! (
              Object.values(mapping[form.id].fmap).includes(f.name) && f.name != value
            )));
            return (
            <tr className="jse-bb">
              <td>{ff.label}</td>
              <td><span className="jse-text-box">{ff.slug}</span></td>
              <td>
                <select key={`select-${form.id}-${ff.slug}`} 
                        name={`select-${form.id}-${ff.slug}`}
                        onChange={(e) => updateFormMapping(form.id, ff.slug, e.target.value)}
                        value={value}
                        disabled={avail.length == 0}>
                  <option key={`${form.id}-${ff.slug}-zero`} value="0">
                    {value !== '0' ? "--Remove Mapping--" : (avail.length ? "--Not Mapped--" : "--All Fields Mapped--") }
                  </option> 
                  {avail.map((f) => (
                    <option key={`${form.id}-${ff.slug}-${f.name}`} value={f.name}>{f.name} ({f.type})</option>
                  ))}
                </select>
              </td>
            </tr>)
          })}
          {(idx+1)<forms.length ? 
          <tr className="thead">
            <td colSpan={2}>Forminator Form</td><td>Select A List</td>
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
export default ForminatorIntegration;