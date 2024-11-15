"use strict";var t=Object.defineProperty;var l=Object.getOwnPropertyDescriptor;var i=Object.getOwnPropertyNames;var s=Object.prototype.hasOwnProperty;var m=(r,e)=>{for(var o in e)t(r,o,{get:e[o],enumerable:!0})},c=(r,e,o,a)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of i(e))!s.call(r,n)&&n!==o&&t(r,n,{get:()=>e[n],enumerable:!(a=l(e,n))||a.enumerable});return r};var w=r=>c(t({},"__esModule",{value:!0}),r);var b={};m(b,{default:()=>d});module.exports=w(b);var d=`#mawns_eslint-overlay-outer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  z-index: 1000;
  justify-content: center;
  align-items: center;
  background-color: rgba(70, 70, 70, 0.5);
  display: none;
}
#mawns_eslint-overlay-outer .active {
  display: flex;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner {
  display: block;
  border: 1px solid rgb(58, 58, 58);
  max-width: 1000px;
  width: 90%;
  height: 95%;
  background-color: rgba(19, 19, 19, 0.5);
  z-index: 1001;
  border-radius: 0.5rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar {
  width: 14px;
  height: 14px;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar-corner {
  background-color: transparent;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar-track {
  background: transparent;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar-thumb {
  height: 6px;
  border: 4px solid rgba(0, 0, 0, 0);
  background-color: rgba(0, 0, 0, 0.2);
  background-clip: padding-box;
  -webkit-border-radius: 7px;
  -webkit-box-shadow: inset -1px -1px 0px rgba(0, 0, 0, 0.05), inset 1px 1px 0px rgba(0, 0, 0, 0.05);
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.4);
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .header {
  background-color: rgba(8, 8, 8, 0.5);
  height: 3rem;
  color: rgb(179, 59, 59);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem 0;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .header::before {
  content: "ESLint run resulted in errors and/or warnings!";
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: auto;
  padding: 1rem 2rem;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .file-wrapper {
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgb(105, 105, 105);
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .result {
  margin: 0;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .file {
  margin-bottom: 0.2rem;
  color: white;
  text-decoration: underline;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .warning {
  color: rgb(216, 183, 36);
  margin-right: 1rem;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .error {
  color: rgb(179, 59, 59);
  margin-right: 1rem;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .row-details {
  margin-right: 1rem;
  color: #636363;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .error-name {
  margin-left: 1rem;
  color: #636363;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .footer {
  background-color: rgba(8, 8, 8, 0.5);
  height: 3rem;
  color: rgb(136, 120, 51);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem 0;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .footer::before {
  content: "Press ESC or click anywhere outside this window to close";
}`;
