import ReactDOM from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
import './index.scss';

import { trackPromise } from 'react-promise-tracker';
import { usePromiseTracker } from "react-promise-tracker";
import Spinner from './spinner.js'

import {API} from './client.js';

import Dashboard from './dashboard';
import ForminatorIntegration from './plugin-forminator';
import AmeliaIntegration from './plugin-amelia';
import WooCommerceIntegration from './plugin-woocommerce';

// global variables carrying the page key and prefix
var __jse_page = document.getElementById('jse-connect-plugin-app').attributes["data-page"].value;
var __jse_prefix = document.getElementById('jse-connect-plugin-app').attributes["data-prefix"].value;

if(typeof window.__JSECNCT === 'undefined') {
  window.__JSECNCT = {
    api: {appAuth: "mock", appUrl: "mock", apiUrl: "mock", nonce: "nonce", siteUrl: 'http://mock', wpApiUrl: "mock"}
  };
}

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value; //assign the value of ref to the argument
  },[value]); //this code will run when the value of 'value' changes
  return ref.current; //in the end, return the current ref value.
}

function App({startPage, pagePrefix}) {

  let { promiseInProgress } = usePromiseTracker();

  const [page, setPage] = useState(startPage);
  const [prefix, setPrefix] = useState(pagePrefix);
  const [lists, setLists] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [settings, setSettings] = useState({connection: false});
 
  useEffect(async () => {
    if(settings.connection) {
      const lists = await API.jseClient('jse/lists',{key: settings.connection.apiKey});
      setLists(lists);
    }
  },[settings])


  const initialize = async () => {
    const _integrations = await API.wpClient('integrations');
    const _settings = await API.wpClient('settings');
    Object.keys(_settings)
    .filter(ikey => ikey !== 'connection')
    .forEach((ikey) => {
      if( ! (ikey in _integrations) ) delete _settings[ikey];
      else {
        if(!_integrations[ikey].available) _settings[ikey].active = false;
      }
    }); 
    setIntegrations(_integrations);
    setSettings(_settings);
    window.history.pushState({jseConnectPluginPage: startPage}, '');
    window.onpopstate = function(event) {
      const state = event.state;
      if(state?.jseConnectPluginPage) setPage(state.jseConnectPluginPage);
    };
  }

  useEffect(() => {
    trackPromise(initialize());
  }, []);

  const saveSettingsSubmit = (e) => {
    e.preventDefault();
    trackPromise(saveSettings(settings));
  }

  const saveSettings = async (settings) => {
    const updatedSettings = await API.wpClient('settings', {body: settings});
    await setSettings(updatedSettings);
    trackPromise(initialize());
  }

  const updateSettings = (plugin, data) => {
    setSettings({...settings, [plugin]: {...data}});
  }

  const toggleActive = async (plugin) => {
    setSettings((settings) => {
      const update = {...settings, [plugin]: {...settings[plugin], active: !settings[plugin].active} };
      const prevActive = Object.values(settings).filter(s => s.active).length;
      const nowActive = Object.values(update).filter(s => s.active).length;
      //console.log("Previously Active: "+prevActive+" Now Active: "+nowActive);
      trackPromise(saveSettings(update));
      return update;
    });
  }

  const buildPageParams = (ikey) => {
    return {
      available: ( (ikey in integrations) && integrations[ikey].available ),
      settings: settings[ikey] ? settings[ikey] : {active: false},
      lists,
      updateSettings: (data) => updateSettings(ikey, data)
    }
  };

  const pageBreadcrumb = () => {
    switch(page) {
      case 'dashboard':
        return 'Integrations';
      case 'woocommerce':
        return 'WooCommerce';
      case 'amelia':
        return 'Amelia';
      case 'forminator':
        return 'Forminator Pro';
    }
    return 'Integrations';
  }

  const navigate = (pageKey) => {
    window.location = pageToUrl(pageKey)
    //window.history.pushState({jseConnectPluginPage: pageKey}, '');
  }

  const pageToUrl = (pageKey) => {
    if(pageKey === 'dashboard') pageKey = 'menu';
    return `/wp-admin/admin.php?page=${prefix}-${pageKey}`
  }

  let opacity = promiseInProgress ? '0.3' : '1';

  return (
    <>
      <Spinner />

      <div className="jse-connect-plugin jse-fade" style={{opacity}}>

          <div className="jse-header">
            <img src="https://app.justsend.email/jse/favicon-32x32.png?jsecnct=1.0.0"></img>
            <h1>JustSend.Email<span>&trade;</span> Connect</h1>
            <div className="jse-breadcrumb">
              {page == 'dashboard' ? 
              <span className="jse-first">Dashboard</span> 
              :
              <a style={{textDecoration: 'none'}} href={pageToUrl('dashboard')}>
                <span className="jse-first">Dashboard</span>
              </a>
              }
              <span className="jse-divider"> | </span>
              <span className="jse-second">{pageBreadcrumb()}</span>
            </div>
          </div>

          {page === 'dashboard'
          ?
          <Dashboard integrations={integrations} 
                     settings={settings} 
                     lists={lists} 
                     saveSettings={saveSettings} 
                     toggleActive={toggleActive} 
                     navigate={navigate} />
          :
          <form id="jse-settings-form" onSubmit={saveSettingsSubmit}>

            {page === 'amelia' ? <AmeliaIntegration {...buildPageParams('amelia')} /> : ""}
            {page === 'forminator' ? <ForminatorIntegration {...buildPageParams('forminator')} /> : ""}
            {page === 'woocommerce' ? <WooCommerceIntegration {...buildPageParams('woocommerce')} /> : ""}

            <div className="submit-area">
              <input type="submit" name="submit" id="submit_f" className="button button-primary" value="Save"/>
            </div>

          </form>}

      </div>
    </>
  )

}

ReactDOM.render(<App startPage={__jse_page} pagePrefix={__jse_prefix}/>, document.getElementById('jse-connect-plugin-app'));

