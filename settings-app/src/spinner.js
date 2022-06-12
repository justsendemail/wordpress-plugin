import React from "react";
import { usePromiseTracker } from "react-promise-tracker";
import "./spinner.scss";

const Spinner = (props) => {
    let { promiseInProgress } = usePromiseTracker();

    return (
        promiseInProgress ? (
          <div className="jsec-spinner-overlay">
            <div className="jsec-spinner"></div>
          </div>
        ) : ""
    );
};
export default Spinner;