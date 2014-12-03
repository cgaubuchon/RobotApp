/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var url = "http://pitchingrobot.local/arduino/servo/",
    canThow = true,
    parentElement,
    accWatcher,
    listeningElement,
    choosePitchElement,
    throwElement,
    thrownElement,
    selectedPitch = null,
    session = null,
    previousAcceleration = { x: null, y: null, z: null };

var app = {
    // Application Constructor
    initialize: function() {
        console.log('jhgsdhf');
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        console.log('binding events');
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        var that = this,
            wsuri;

         // wsuri = "ws://localhost:8080/ws";

         //wsuri = "ws://" + document.location.hostname + ":8080";


        // connect to WAMP server
        // var connection = new autobahn.Connection({
        //    url: wsuri,
        //    realm: 'realm1'
        // });

        // connection.onopen = function(new_session) {
        //    session = new_session;
        //    console.log("New session oened!");
        // };

        // connection.open();
        app.receivedEvent('deviceready');
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        parentElement = document.getElementById(id);

        listeningElement = parentElement.querySelector('.listening');
        choosePitchElement = parentElement.querySelector('.choosePitch');
        throwElement = parentElement.querySelector('.waitingForThrow');
        thrownElement = parentElement.querySelector('.ballThrown');

        app.listenForPitch();
    },

    controlServo: function(turnOn) {
        session.call("com.myapp.mcu.control_servo", [turnOn]);
        canThow = true;
    },

    listenForPitch: function(){
        $(".buttons").on("touchend", "button", app.handleButtonSelect);
        app.updateStatus(2);
    },

    handleButtonSelect: function(e){
        var $el = $(e.target);

        app.killThrowListen();
        $(".buttons .selected").removeClass("selected");
        $el.addClass("selected");
        selectedPitch = $(".buttons .selected").data("pitchnumber");

        app.initThrowListen();
        app.updateStatus(3);
    },

    updateStatus: function(step){
        listeningElement.setAttribute('style', 'display:none;');
        choosePitchElement.setAttribute('style', 'display:none;');
        throwElement.setAttribute('style', 'display:none;');
        thrownElement.setAttribute('style', 'display:none;');

        switch(step) {
            case 1:
                listeningElement.setAttribute('style', 'display:block;');
            break;
            case 2:
                choosePitchElement.setAttribute('style', 'display:block;');
            break;
            case 3:
                throwElement.setAttribute('style', 'display:block;');
            break;
            case 4:
                thrownElement.setAttribute('style', 'display:block;');
            break;
            default:
                listeningElement.setAttribute('style', 'display:block;');
            break;
        }

    },

    initThrowListen: function(){
        accWatcher = navigator.accelerometer.watchAcceleration(app.accelerometerSuccess, app.accelerometerError, { frequency: 100 } );
    },

    killThrowListen: function(){
        navigator.accelerometer.clearWatch(accWatcher);
    },

    accelerometerSuccess: function(acceleration){
        var accelerationChange = {};

        if (previousAcceleration.x !== null) {
            accelerationChange.x = Math.abs(previousAcceleration.x, acceleration.x);
            accelerationChange.y = Math.abs(previousAcceleration.y, acceleration.y);
            accelerationChange.z = Math.abs(previousAcceleration.z, acceleration.z);
        }

        if (accelerationChange.x + accelerationChange.y + accelerationChange.z > 30) {
            // Throw detected
            app.killThrowListen();
            $(".ballThrown span").html("Pitch "+selectedPitch+" thrown. ");
            app.sendPitchCommand(selectedPitch);
            app.updateStatus(4);

            previousAcceleration = {
                x: null,
                y: null,
                z: null
            };

        }else {
            previousAcceleration = {
                x: acceleration.x,
                y: acceleration.y,
                z: acceleration.z
            };
        }
    },
    accelerometerError: function(){
        alert("Ut Oh, Big error with the accelerometer.");
    },
    sendPitchCommand: function(pitchnumber){

        //TODO: This should have some pitch change logic here for different pitches
        if(canThow){
            canThow = false;
            if(pitchnumber == 1){
                app.controlServo('slider');
            }else if(pitchnumber == 2){
                app.controlServo('fastball');
            }else{
                app.controlServo('curve');
            }
        }
    }
};