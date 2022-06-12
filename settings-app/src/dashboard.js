import React, { useState, useEffect, useRef } from 'react';
import './index.scss';

import { trackPromise, usePromiseTracker } from 'react-promise-tracker';

import {API} from './client.js';

const Dashboard = ({integrations, settings, lists, saveSettings, toggleActive, navigate}) => {

  let { promiseInProgress } = usePromiseTracker();

  const connectClick = (e) => {
    if(window.__jse__auth_popup) window.__jse__auth_popup.close();
    const width = 540;
    const height = 440;
    const left = (window.screenX + (window.outerWidth - width) / 1.8);
    const top = (window.screenY + (window.outerHeight - height) / 2.8);
    const title = `JSE Connect`;
    const state = {origin: window.location.origin, name: 'Wordpress: '+__JSECNCT.api.siteUrl};
    const url = __JSECNCT.api.appAuth+'&state=connect:'+btoa(JSON.stringify(state))
    const popup = window.open(url, title, `width=${width},height=${height},left=${left},top=${top}`);
    window.__jse__auth_popup = popup;
  }

  const processMessage = async (e) => {
    if(e.origin == __JSECNCT.api.appUrl) {
      const connection = await API.jseClient('jse/connect', {token: e.data, body: {name: `WordPress: ${__JSECNCT.api.siteUrl}`}});
      //console.log("New Settings:", {...settings, connection});
      trackPromise(saveSettings({...settings, connection}));
      setTimeout(() => {
        window.__jse__auth_popup.close();
      },200);
    }
  }
  useEffect(() => {
    window.addEventListener("message", processMessage);
  }, []);

  const disconnectClick = (e) => {
    const {connection, ...settingsSansConnection} = settings;
    console.log("Disconnected Settings:", settingsSansConnection);
    trackPromise(saveSettings(settingsSansConnection));
  }

  return (
    <>
      <div className="jse-connect-status">
        { settings.connection ? 
          <>
          <p>
            <span className="green" style={{fontWeight: 600, fontSize: 18,paddingBottom: 8}}>Account Connected!</span><br/>
            <span style={{fontWeight: 600}}>Login Email: </span><span>{settings.connection.login}</span><br/>
            <span style={{fontWeight: 600}}>Account Name: </span><span>{settings.connection.brand}</span><br/>
            <span style={{fontWeight: 600}}>API Key: </span><span>{settings.connection.apiKey}</span>
          </p> 
          <button onClick={disconnectClick} className="button jse-button jse-small jse-right">Disconnect</button>
          </>
          :
          promiseInProgress ?
          <h3>Loading...</h3>
          :
          <>
            <p>
              Click the Connect button to get started. This opens a JustSend.Email login window that creates a secure
              connection between this website and a JustSend.Email account. Enter your JustSend.Email login email and
              password to login and create the connection!
            </p>
            <p>
              If you don&apos;t have a JustSend.Email account, sign up at <a target="_blank" href="https://justsend.email">JustSend.Email</a> to get started.
            </p>
            <button onClick={connectClick} className="button jse-button">Connect</button>
          </>
        }
      </div>
      { settings.connection ?
      <div className="jse-information">
        <h1>Integrations</h1>
        <p>
          Below is a list of installed WordPress Plugins that are available for integration with JustSend.Email. Click
          the Activate button to activate a plugin integration. Click the manage button to map fields and configure a
          plugin integration.
        </p>
        <table>
          <thead>
            <tr>
              <td>Plugin Name</td><td>Available</td><td>Activate</td><td>Manage</td>
            </tr>
          </thead>
          <tbody>
            {Object.entries(integrations).map(([ikey,itg]) => 
              <tr key={`${ikey}`}>
                <td>{itg.name}</td>
                {itg.available ? <td className="yes">Yes</td> : <td className="no">No</td>}

                <td>
                  <label className="jse-switch">
                    <input disabled={!(ikey in settings)} type="checkbox" id="woo-active" name="woo-active"
                           checked={!settings[ikey] ? false : settings[ikey].active}
                           onChange={() => toggleActive(ikey)}
                    />
                    <span className="jse-slider"/>
                  </label>
                </td>
                {itg.available ? <td><button onClick={() => navigate(ikey)} className="button jse-button jse-mini">Manage</button></td> : <td className="no"></td>}
              </tr>
            )}
          </tbody>
        </table>
      </div> : ""}
    </>
  )

}

export default Dashboard;

