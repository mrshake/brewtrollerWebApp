Brewtroller = {};
var host;
var username = "admin";
var password = "password";
var connected = false;
var lastUpdate = 0;
var storedHost;
var programList = [];
var programStep1;
var programStep2;
var programName1;
var programName2;

//Brewtroller Web Init
Brewtroller.init = function () {
  $('#button_connect').on("click", function() {
    Brewtroller.connected.click_buttonConnect();
    //Brewtroller.program.getProgramList();
  });
  $('#settingsSaveBtn').on("click", function() {
    Brewtroller.connected.saveConnectionSettings();
  });
  $('#button_reset').on("click", function() {
	Brewtroller.reset.resetPrograms(); 
  });
  $('#button_nextStep').on("click", function () {
	 Brewtroller.program.nextStep(); 
  });
  $('.boilControl').on("change", function () {
	  Brewtroller.boil.control(this.name);
  });
//  $('.boilControl').on("change", function () {alert("hey!")});
  storedHost = localStorage.getItem('btHost');
  if (storedHost) {
    host = storedHost;
    $('#settingsHost').attr('placeholder', host);
  };
//  $("#boilTimerGraphical").TimeCircles(
//	{
//		time: {
//			Days: { show: false },
//			Hours: { show: true },
//			Minutes: { show: true },
//			Seconds: { show: true }
//		}	  
//	}
//  );
//  Brewtroller.timer.display = new SegmentDisplay("mashTimerGraphical");
//  Brewtroller.timer.display.pattern         = "##:##:##";
//  Brewtroller.timer.display.displayAngle    = 6;
//  Brewtroller.timer.display.digitHeight     = 5;
//  Brewtroller.timer.display.digitWidth      = 5;
//  Brewtroller.timer.display.digitDistance   = 0.40;
//  Brewtroller.timer.display.segmentWidth    = 0.70;
//  Brewtroller.timer.display.segmentDistance = 0.10;
//  Brewtroller.timer.display.segmentCount    = 7;
//  Brewtroller.timer.display.cornerType      = 3;
//  Brewtroller.timer.display.colorOn         = "#090909";
//  Brewtroller.timer.display.colorOff        = "#afcbaf";
//  Brewtroller.timer.display.draw();
  
  //display file contents
  $('#loadBeerXMLButton').on("click", function() {
	  Brewtroller.program.loadBeerXML();
  });
  
  Brewtroller.timer.setup();
  Brewtroller.temp.setup();
  $('#programSlot2').hide();
  $("#beerXMLModalButton").attr("disabled", "disabled");
  $("#programModalButton").attr("disabled", "disabled");
  $("#programSlot1").hide();
  $("#powerControl").hide();
  $("#powerSlider").slider().on("slide", function(ev){
	  $("#boilPower").text(ev.value);
	  Brewtroller.boil.control("2", ev.value);
  });
  $("#powerSlider").slider().on("slideStop", function(ev){
	  Brewtroller.boil.control("2", ev.value);
  });
};

//Brewtroller Connected Functions

Brewtroller.connected = {
    click_buttonConnect : function () {
        if (connected) {
            connected = false;
            $("#button_connect").html("Connect");
            $("#button_connect").css('color', '#777777');
        } else {
            connected = true;
            Brewtroller.connected.loop();
            Brewtroller.program.getProgramList();
            $("#beerXMLModalButton").removeAttr("disabled");
            $("#programModalButton").removeAttr("disabled");
        }
    },    
    loop : function () {
      if(connected == true) {
        Brewtroller.connected.checkWatchdog();
        brewTrollerExecCommand(BTCMD_GetStatus, null, {}, host, username, password, Brewtroller.status.printUI);
        setTimeout(Brewtroller.connected.loop, 500);
        Brewtroller.status.updateStatusBar();
      }
    },
    checkWatchdog : function () {
        var d = new Date();
        if (d.getTime() - lastUpdate > 1000) {
            $("#button_connect").html("Timeout");
            $("#button_connect").css('color', 'red');
            $("#modal_Timeout").modal();
        }else{
        	$("#modal_Timeout").modal("hide");
        }
    },
    connectWatchdog : function () {
    	var d = new Date();
        lastUpdate = d.getTime();
        $("#button_connect").css('color', '#777777');
        $("#button_connect").html("Disconnect");
    },
    saveConnectionSettings : function () {
      host = $('#settingsHost').val();
      $('#settingsHost').text("host");
      localStorage.setItem('btHost',host);
    }
    
};

//Program Functions
Brewtroller.program = {
  getProgramList : function () {
    brewTrollerExecCommand(BTCMD_GetProgramList, null, null, host, username, password, function(data){
    	programList = data;
    	programNumber = 0;
    	$.each(data, function(index,value) {
    		if (value != ">" && value != "") {
    			var recipeLine = '<tr><td class="text-muted">';
    			recipeLine += index;
    			recipeLine += '</td><td id="programID">';
          recipeLine += programNumber;
    			recipeLine += '</td><td>';
    			recipeLine += value;
    			recipeLine += '</td><td><button id="';
    			recipeLine += programNumber;
    			recipeLine += '_1" type="button" class="btn btn-default" data-dismiss="modal">Start Program 1</button>';
    			recipeLine += '</td><td><button id="';
    			recipeLine += programNumber;
    			recipeLine += '_2" type="button" class="btn btn-default" data-dismiss="modal">Start Program 2</button>';
    			recipeLine += '</td></tr>';
    			recipeBtnId1 = programNumber + "_1";
    			recipeBtnId2 = programNumber + "_2";
    			$('#recipeDetails table tbody').append(recipeLine);
    			$('#' + recipeBtnId1).on("click", function () {
    				var reci = $(this).attr('id').split("_");
    			  Brewtroller.program.startStep(reci[0], "0"); 
    			  });
    			$('#' + recipeBtnId2).on("click", function () {
    			  var reci = $(this).attr('id').split("_");
    			  Brewtroller.program.startStep(reci[0], "0"); 
    			  });
    		}
    		if (index != "Response Code") {
    		  programNumber++;
    		}
    	});
    });
  },
  startStep : function (program, step) {
	  brewTrollerExecCommand(BTCMD_StartStep, program, step, host, username, password, function(data){});
  },
  nextStep : function () {
	  if (programStep1 != "255") {
		  brewTrollerExecCommand(BTCMD_NextStep, programStep1, null, host, username, password, function(data){});
		}
	  if (programStep2 != "255") {
		  brewTrollerExecCommand(BTCMD_NextStep, programStep2, null, host, username, password, function(data){});	  
		}
	},
  loadBeerXML : function() {
		//get file object
	      var file = $("#file").get(0).files;
	      if (file) {
	          // create reader
	          var reader = new FileReader();
	          reader.readAsText(file[0]);
	          reader.onload = function(e) {
	              // browser completed reading file - display it
	        	    var beerXML = e.target.result;
	        	    var beerJSON = $.xml2json(beerXML);
	        	    Brewtroller.program.sendRecipeToBrewtroller(beerJSON);
	          };
		   $("#modal_beerXMLLoader").modal("hide"); 
		   Brewtroller.program.getProgramList();
	      }
  },
  sendRecipeToBrewtroller : function (beerJSON) {
	  var recipeSlot = $("#loadProgramNumber").val(),
	  	  doughIn,
	  	  proteinRest,
	  	  proteinTime,
	  	  acidRest,
	  	  saccRest,
	  	  saccRest2,
	  	  mashOut,
	  	  hopBitMask = "",
	  	  bitMaskHash = [],
	  	  bitMaskSplit,
	  	  hopTimes = [
	  	              "105",
	  	              "90",
	  	              "75",
	  	              "60",
	  	              "45",
	  	              "30",
	  	              "20",
	  	              "15",
	  	              "10",
	  	              "5",
	  	              "0",
	  	              ],
	  	  $i = 1,
	  	  name = beerJSON["RECIPE"]["NAME"],
	  	  batchSize = beerJSON["RECIPE"]["BATCH_SIZE"],
	  	  grainWeight = 0;
	  	  grainRatio = parseFloat(beerJSON["RECIPE"]["MASH"]["MASH_STEPS"]["MASH_STEP"]["WATER_GRAIN_RATIO"]),
	  	  doughInTemp = 0, //beerJSON["RECIPE"]["DOUGHINTEMP"],
	  	  doughInTime = "0", //beerJSON["RECIPE"]["DOUGHINMINUTES"],
	  	  acidTemp = 0, //beerJSON["RECIPE"]["ACIDTEMP"],
	  	  acidTime = "0", //beerJSON["RECIPE"]["ACIDMINUTES"],
	  	  proteinTemp = 0,
	  	  proteinTime = "0",
	  	  saccTemp = 0,
	  	  saccTime = "0",
	  	  saccTemp2 = 0,
	  	  saccTime2 = "0",
	  	  mashOutTemp = 0,
	  	  mashOutTime = "0",
	  	  spargeTemp = beerJSON["RECIPE"]["MASH"]["SPARGE_TEMP"],
	  	  boilTime = beerJSON["RECIPE"]["BOIL_TIME"],
		  chillTemp = beerJSON["RECIPE"]["PRIMARY_TEMP"];
	  $.each(beerJSON["RECIPE"]["FERMENTABLES"]["FERMENTABLE"], function(index, value) {
		  grainWeight = grainWeight + parseFloat(value["AMOUNT"]);
		});
	  $.each(beerJSON["RECIPE"]["MASH"]["MASH_STEPS"]["MASH_STEP"], function(index, value) {
		if(value["NAME"] == "Protein Rest") {
			proteinRest = value;
		}else if (value["NAME"] == "Saccharification") {
			saccRest = value;
		}else if (value["NAME"] == "mashOut") {
			mashOut = value;
		}
	  });
	  if (proteinRest) {
		  proteinTemp = proteinRest["STEP_TEMP"];
		  proteinTime = proteinRest["STEP_TIME"];
	  	  }	
	  if (saccRest) {
		  saccTemp = saccRest["STEP_TEMP"];
		  saccTime = saccRest["STEP_TIME"];
		  }
	  if (saccRest2) {
		  saccTemp2 = saccRest2["STEP_TEMP"];
		  saccTime2 = saccRest2["STEP_TIME"];
		  }
	  if (mashOut) {
		  mashOutTemp = mashOut["STEP_TEMP"];
		  mashOutTime = mashOut["STEP_TIME"];
		  }
	  
	  if(beerJSON["RECIPE"]["HOPS"]["HOP"][0]) {
	  $.each(beerJSON["RECIPE"]["HOPS"]["HOP"], function(index, value){
		bitMaskSplit = value["TIME"].split(".");
		bitMaskHash[bitMaskSplit[0]] = "1";
	  });
  	  } else {
  		bitMaskSplit = beerJSON["RECIPE"]["HOPS"]["HOP"]["TIME"].split(".");
		bitMaskHash[bitMaskSplit[0]] = "1";  
  	  };
	  $.each(hopTimes, function (index, value) {
		  if(bitMaskHash[value]) {
			  hopBitMask = hopBitMask + "1";
		  }else{
			  hopBitMask = hopBitMask + "0";
		  }
	  });
	  brewTrollerExecCommand(BTCMD_SetProgramSettings,
			  recipeSlot,
			  {
			      "Sparge_Temp": spargeTemp,
				  "HLT_Setpoint": "0", //HLT Setpoint
				  "Boil_Mins": boilTime,
				  "Pitch_Temp": chillTemp,
				  "Boil_Additions": hopBitMask,
				  "Mash_Liquor_Heat_Source": "0"
			  },			  
			  host,
			  username,
			  password,
			  function(data){});
    
	  brewTrollerExecCommand(BTCMD_SetProgramName,
			  recipeSlot,
			  {
		  		"Program_Name": name
			  },			  
			  host,
			  username,
			  password,
			  function(data){});
	  
	  brewTrollerExecCommand(BTCMD_SetProgramMashTemps,
			  recipeSlot,
			  {
			  "Dough_In_Temp": doughInTemp,
			  "Acid_Temp": acidTemp,
			  "Protein_Temp": proteinTemp,
			  "Sacch_Temp": saccTemp,
			  "Sacch2_Temp": saccTemp2,
			  "Mash_Out_Temp": mashOutTemp
			  },			  
			  host,
			  username,
			  password,
			  function(data){});
	  
	  brewTrollerExecCommand(BTCMD_SetProgramMashMins,
			  recipeSlot,
			  {
			  "Dough_In_Mins": doughInTime,
			  "Acid_Mins": acidTime,
			  "Protein_Mins": proteinTime,
			  "Sacch_Mins": saccTime,
			  "Sacch2_Mins": saccTime2,
			  "Mash_Out_Mins": mashOutTime
			  },			  
			  host,
			  username,
			  password,
			  function(data){});
	  
	  
	  brewTrollerExecCommand(BTCMD_SetProgramVolumes,
			  recipeSlot,
			  {
			  "Batch_Volume": batchSize,
			  "Grain_Weight": grainWeight,
			  "Mash_Ratio": grainRatio
			  },			  
			  host,
			  username,
			  password,
			  function(data){});
	  
  }  
};


//Timer Functions
Brewtroller.timer = {
  setup : function () {
    $('#mashTimerButton').on("click", function() {
      Brewtroller.timer.click_startTimer("mash");
    });
    $('#boilTimerButton').on("click", function() {
      Brewtroller.timer.click_startTimer("boil");
    });
    $.each([ 0 , 1 ], function( index, timerId ){ 
    if (timerId == 0) {vessel = "mash";};
    if (timerId == 1) {vessel = "boil";};
    brewTrollerExecCommand(BTCMD_GetTimerStatus, timerId, null, host, username, password, function(data){
      timerStatus = data.TimerStatus;
      if (timerStatus == "0") {
        $("#" + vessel + "TimerButton").text("Manual Start");
        Brewtroller.timer.printTimer();
      }else{
        $("#" + vessel + "TimerButton").text("Pause");
        Brewtroller.timer.printTimer();
      }
    });
    });
  },
  printTimer : function (id, value, status) {
    var rStatus;
    if(status == 0) {
        rStatus = "Off";
      }else{
        rStatus = "On";
      }
    $(id).html("Set Time: " + millisecondsToTime(value) + " seconds <br>Status: " + rStatus);
    },
    click_startTimer : function (vessel) {
      var timerStatus;
      var timerId = "";
      var setTime = "";
      var vessel = vessel;
      if (vessel == "mash") {
        timerId = 0;
      } else if (vessel == "boil") {
        timerId = 1;
      }
      brewTrollerExecCommand(BTCMD_GetTimerStatus, timerId, null, host, username, password, function(data){
        timerStatus = data.TimerStatus;
        if (timerStatus == "0") {
          $timer = "werwe";
          brewTrollerExecCommand(BTCMD_StartTimer, timerId, {"TimerStatus": 1}, host, username, password, function(data){
          });
          $("#" + vessel + "TimerButton").text("Pause");
          Brewtroller.timer.printTimer("div_" + vessel + "Timer", "", "1");
        }else{
          $timer = "wwerwe";
          brewTrollerExecCommand(BTCMD_StartTimer, timerId, {"TimerStatus": 0}, host, username, password, function(data){
          });
          $("#" + vessel + "TimerButton").text("Manual Start");
          Brewtroller.timer.printTimer("div_" + vessel + "Timer", "", "0");
        }
      });
      
    }
};

//Temp Functions
Brewtroller.temp = {
    setup : function() {
      $('#hltTempSetBtn').on("click", function () {
        temp = $('#hltTempSet').val();
        Brewtroller.temp.setTemp(0, temp);
      });
      $('#mashTempSetBtn').on("click", function () {
        temp = $('#mashTempSet').val();
        Brewtroller.temp.setTemp(1, temp);
      });
    },
    setTemp : function (vessel, temp) {
            brewTrollerExecCommand(BTCMD_SetSetpoint, vessel, {"Setpoint":temp}, host, username, password, function(data){
      });
    }  
};

//Reset Functions
Brewtroller.reset = {
	resetPrograms : function() {
		brewTrollerExecCommand(BTCMD_Reset, "0", null, host, username, password, function(data){
	    });
		$('.program1Name').html('No Program Selected (1)');
		$('.program2Name').html('No Program Selected (2)');
	}
}

//Status Functions
Brewtroller.status = {
	updateStatusBar : function () {
		if(programStep2 != "255") {$('#programSlot2').show();}else{$('#programSlot2').hide();};
		if(programStep1 != "255") {$('#programSlot1').show();}else{$('#programSlot1').hide();};
		if(programName1 != "") {$('.program1Name').html(programName1);};
		if(programName2 != "") {$('.program2Name').html(programName2);};
		if(programStep1 == "255") {$('.program1Name').html('No Program Selected (1)');};
		if(programStep2 == "255") {$('.program2Name').html('No Program Selected (2)');};
		$('#currStatusProg1').html(Brewtroller.status.translateStepCode(programStep1));
		$('#currStatusProg2').html(Brewtroller.status.translateStepCode(programStep2));
	},
	translateStepCode : function (step) {
		var stepTranslate = {
							"0": "Fill",
							"1": "Delay",
							"2": "Preheat",
							"3": "Grain In",
							"4": "Refill",
							"5": "Dough In",
							"6": "Acid",
							"7": "Protein",
							"8": "Sacch",
							"9": "Sacch2",
							"10": "Mash Out",
							"11":"Mash Hold",
							"12": "Sparge",
							"13": "Boil",
							"14": "Chill",
							"255": "Idle"
							}
		return stepTranslate[step];
	},
	printUI : function (data) {
		$('#tempStatus').html(data["ProgramThread1_Name"]);
	  programName1 = data["ProgramThread1_Name"];
		programName2 = data["ProgramThread2_Name"];
		programStep1 = data["ProgramThread1_Step"];
		programStep2 = data["ProgramThread2_Step"];
		$("#div_status").html("<pre>" + JSON.stringify(data, null, '\t') + "</pre>");
        printProgramThread("#div_programThread1", data.ProgramThread1_Step, data.ProgramThread1_Recipe);
        printProgramThread("#div_programThread2", data.ProgramThread2_Step, data.ProgramThread2_Recipe);
        Brewtroller.timer.printTimer("#div_mashTimer", data.Mash_TimerValue, data.Mash_TimerStatus);
        Brewtroller.timer.printTimer("#div_boilTimer", data.Boil_TimerValue, data.Boil_TimerStatus);
        printAlarm("#button_alarm", data.alarmStatus);
        printTemperature("#div_hltTemperature", data.HLT_Temperature);
        printSetpoint("#div_hltSetpoint", data.HLT_Setpoint);
        printHeatPower("#div_hltHeatPower", data.HLT_HeatPower);
		printVolume("#div_hltVolume", data.HLT_Volume);
		printTargetVolume("#div_hltTargetVolume", data.HLT_TargetVolume);
		printFlowRate("#div_hltFlowRate", data.HLT_FlowRate);
        printTemperature("#div_mashTemperature", data.Mash_Temperature);
        printSetpoint("#div_mashSetpoint", data.Mash_Setpoint);
        printHeatPower("#div_mashHeatPower", data.Mash_HeatPower);
		printVolume("#div_mashVolume", data.Mash_Volume);
		printTargetVolume("#div_mashTargetVolume", data.Mash_TargetVolume);
		printFlowRate("#div_mashFlowRate", data.Mash_FlowRate);
        printTemperature("#div_kettleTemperature", data.Kettle_Temperature);
        printSetpoint("#div_kettleSetpoint", data.Kettle_Setpoint);
        printHeatPower("#div_kettleHeatPower", data.Kettle_HeatPower);
		printVolume("#div_kettleVolume", data.Kettle_Volume);
		printTargetVolume("#div_kettleTargetVolume", data.Kettle_TargetVolume);
		printFlowRate("#div_kettleFlowRate", data.Kettle_FlowRate);
		printBoilControl("#div_boilControl", data.Boil_ControlState);
	    printOutputProfiles("#div_outputProfiles", data.profileStatus);
		printOutputStatus("#div_outputStatus", data.outputStatus);
		if (data.Boil_ControlState === "2") {
			$("#powerControl").show();
			$("#boilManual").parent().button("toggle");
		}else if (data.Boil_ControlState === "1") {
			$("#powerControl").hide();
			$("#boilAuto").parent().button("toggle");
		}else{
			$("#powerControl").hide();
			$("#boilOff").parent().button("toggle");
		}
        Brewtroller.connected.connectWatchdog();
    }
	};


// Boil Control Functions
Brewtroller.boil = {
	control : function (control, percentage) {
		var controlMode,
			controlPercentage;
		if (control == "boilOff") {
			controlMode = 0;
			controlPercentage = 0;
			$("#powerControl").hide();
		}else if (control == "boilAuto") {
			controlMode = 1;
			controlPercentage = 0;
			$("#powerControl").hide();
		}else{
			controlMode = 2;
			if (percentage) { 
				controlPercentage = percentage;
			}else{
			controlPercentage = 100;
			}	
			$("#powerControl").show();
		}
		brewTrollerExecCommand(BTCMD_SetBoilControl, null, {"Control_Mode":controlMode, "Percentage":controlPercentage}, host, username, password, function(data){
			$("#powerSlider").slider('setValue', controlPercentage);
			$("#boilPower").text(controlPercentage);
			
		});
	}
};

//Command Helper Functions
function brewTrollerExecCommand(cmdObj, index, params, host, user, pwd, callback){
	var command = cmdObj.reqCode;
	if (cmdObj.reqIndex) {
		command += index;
	}
	command += brewtrollerParseRequestParameters(cmdObj, params);
	$.ajax({
		url: "http://" + host + "/btnic.cgi",
//		beforeSend: function (xhr) {
//           if(user != null) {
//                xhr.withCredentials = true;
//                var tok = user + ':' + password;
//                var hash = btoa(tok);
//                xhr.setRequestHeader("Authorization", "Basic " + hash);
//           }
//		},
		data: command,
		dataType: "json",
		success:function(result){
			var object = brewTrollerParseResponse(result, cmdObj);
			callback(object);
			return object;
		},
		error: function(result) {
		}
	});
}

function brewtrollerParseRequestParameters(cmdObj, params) {
	var parameters = [];
	if (cmdObj.reqParams.length) {
		for (var i = 0; i < cmdObj.reqParams.length; i++) {
			parameters[i] = params[cmdObj.reqParams[i]];
		}
	}
	return (parameters.length ? "&" + parameters.join('&') : "");
}

function brewTrollerParseResponse(result, cmdObject)
{
	if (result[0][0] != cmdObject.rspCode) {
		var errorText;
		switch (result[0]) {
			case '!':
				errorText = "Bad Command";
				break;
			case '#':
				errorText = "Bad Parameter";
				break;
			case '$':
				errorText = "Bad Index";
				break;
			default:
				errorText = "Unknown response: " + result[0];
				break;
		}
		throw new Error("BrewTroller response error: " + errorText);
	}
	var returnObject;
	returnObject = {};
	for (var i = 0; i < cmdObject.rspParams.length; i++){
		returnObject[cmdObject.rspParams[i]] = result[i];
	}
	return returnObject;
};


function millisecondsToTime(milli)
{
      var milliseconds = milli % 1000;
      var seconds = Math.floor((milli / 1000) % 60);
      var minutes = Math.floor((milli / (60 * 1000)) % 60);

      return minutes + "m" + seconds + "s" + milliseconds + "ms";
};