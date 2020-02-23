const classNames = {
    TODO_ITEM: 'todo-container',
    TODO_CHECKBOX: 'todo-checkbox',
    TODO_TEXT: 'todo-text',
    TODO_DELETE: 'todo-delete',
};

const list = document.getElementById('pomodoro-timer');
const itemCountSpan = document.getElementById('item-count');
const uncheckedCountSpan = document.getElementById('unchecked-count');
const toggle = document.getElementById('toggle-timer');
const defaultTime = document.getElementById('default-time');

//const editDefaultEndTime = false;

class TimerGroup {
    constructor (myTimer) {
        this.members = [];
        myTimer.active = true;
        this.members.push(myTimer);
        this.name = myTimer.name || "new Member";
        this.active = false;
        this.interval = 0;
        this.elapsedTime = 0;
        this.cycles = 0;
        //this.editTime = false;
        this.defaultEndTime = 60;
        this.editDefaultEndTime = false;
    }
    countMembers() {
        let keys = this.getKeys();
        return keys.length;
    }
    timersLeft() {
        let count = 0;
        let keys = this.getKeys();
        for (const key in keys) {
            if (this.members[key].alive()){
                count++;
            } else if (!this.members[key].active && !this.members[key].checked) {
                count++;
            }
        }
        return count;
    }
    fullReset () {
        this.pauseTimer();
        this.elapsedTime = 0;
        this.cycles = 0;
        this.active = false;
        let keys = this.getKeys();
        for (const key in keys) {
            this.members[key].elapsedTime = 0;
            this.members[key].active = false;
        }
        toggle.innerHTML = "Start";
        this.switchTimers();
        this.render();
    }
    reset () {
        let keys = this.getKeys();
        for (const key in keys) {
            this.members[key].elapsedTime = 0;
            this.members[key].active = false;
        }
        this.switchTimers();
        this.render();
    }
    toggleTimer () {
        if (this.active === false) {
            this.startTimer();
        } else {
            this.pauseTimer();
        }
    }
    startTimer () {
        this.active = true;
        this.interval = setInterval(() => this.iterateTime(), 1000);
        toggle.innerHTML = "Pause";
    }
    pauseTimer () {
        this.active = false;
        clearInterval(this.interval);
        toggle.innerHTML = "Resume";
    }
    add (item) {
        if (!this.has(item.name)) {
            this.members.push(item)
        }
    }
    delete (name) {
        // check to see if task name is present
        if (this.has(name)) {
            // filter out the toDo that has the same name as the given name passed
            this.members = this.members.filter( tempMember => tempMember.name !== name);
        }
        this.render();
    }
    has (name) {
        let keys = this.getKeys();
        let included = false;
        for (const key in keys) {
            if (this.members[key].name === name) {
                included = true;
            }
        }
        return included;
    }
    getKeys () {
        const keys = Object.keys(this.members);
        return keys;
    }
    updateName (oldname, newname) {
        if (this.has(oldname)) {
            let keys = this.getKeys();
            for (const key of keys) {
                if (this.members[key].name === oldname) {
                    this.members[key].toggleNameEdit();
                    this.members[key].setName(newname);
                }
            }
        }
        this.render();
    }
    updateTime (name, newTime) {
        if (this.has(name)) {
            let keys = this.getKeys();
            for (const key of keys) {
                if (this.members[key].name === name) {
                    if (this.members[key].alive()) {
                        this.pauseTimer();
                    }
                    this.members[key].toggleTimeEdit();
                    this.members[key].setEndTime(this.parseTime(newTime));
                }
            }
        }
        this.render();
    }
    parseTime(str) {
        let newTime = 0;
        if (str.includes(":")) {
            var res = str.split(":");
            newTime = Number(res[0])*60 + Number(res[1]);
        } else {
            newTime = Number(str);
        }
        return newTime;
    }
    fetchMember (name) {
        if (this.has(name)) {
            let keys = this.getKeys();
            for (const key in keys) {
                if (this.members[key].name === name) {
                    return this.members[key];
                }
            }
        }
        return ErrorEvent;
    }
    iterateTime () {
        this.elapsedTime++;
        if (this.timersLeft() > 0) {
            let keys = this.getKeys();
            for (const key in keys) {
                this.members[key].iterateTime();
            }
        } else {
            this.cycles++;
            this.reset();
        }
        this.render();
    }
    combineHTMLstrings (before, after) {
        return (before + after);
    }
    switchTimers () {
        let startNextTimer = true;
        let keys = this.getKeys();
        for (const key in keys) {
            if (!this.members[key].active && startNextTimer && !this.members[key].checked) {
                this.members[key].active = true;
                startNextTimer = false;
            } else if (this.members[key].active && startNextTimer && this.members[key].checked) {
                this.members[key].active = false;
            } else if (this.members[key].active && !this.members[key].ended()) {
                startNextTimer = false;
            } else if (this.members[key].active && this.members[key].ended()) {
                startNextTimer = true;
            }  
        }
        this.enforceOnlyOneAliveTimer();
    }
    enforceOnlyOneAliveTimer () {
        let oneAliveTimer = false;
        let keys = this.getKeys();
        for (const key in keys) {
            if (!oneAliveTimer && this.members[key].alive()) {
                oneAliveTimer = true;
            } else if (oneAliveTimer && this.members[key].alive()) {
                this.members[key].active = false;
            }
        }
    }
    render () { 
        itemCountSpan.innerHTML = this.countMembers();
        uncheckedCountSpan.innerHTML = this.countUnChecked();
        //Switch on next timer
        this.switchTimers();
        list.innerHTML = "";
        //list.innerHTML += "Running Total Time: " + this.getFormattedTime(this.elapsedTime) + " , Cycles: " + this.cycles;
        list.innerHTML += this.renderTotalTimeHTML();
        list.innerHTML += " " + this.cycles + " previous iterations";
        //list.innerHTML += {() => this.getRenderHTML()};
        //list.innerHTML += (function () {this.getRenderHTML()})();
        //const me = this; list.innerHTML += me.getRenderHTML();
        list.innerHTML += this.getRenderHTML();

        //this.members.map(timer => timer.render());

        this.renderDefaultTime ();
    }

    renderDefaultTime () {
        let outputHTML = "";

        if (!this.editDefaultEndTime) {
            outputHTML += this.renderDisplayOnlyTimeTextboxHTML();
        } else {
            outputHTML += this.renderEditableTimeTextboxHTML();
        }

        defaultTime.innerHTML = outputHTML;
        //defaultTime.innerHTML = this.getFormattedTime(this.defaultEndTime);
    }
    editDefaultTaskTime() {
        this.editDefaultEndTime = !this.editDefaultEndTime;
        this.render();
    }
    renderDisplayOnlyTimeTextboxHTML () {
        let outputHTML = "";
        outputHTML += "<span ";
        outputHTML += "id=\"default-time-inner\"";
        outputHTML += "onClick=\"myGroup.editDefaultTaskTime()\"";
        outputHTML += ">";
        outputHTML += this.getFormattedTime(this.defaultEndTime);
        outputHTML += "</span>";
        return outputHTML;
    }

    renderEditableTimeTextboxHTML () {
        // render the text and the textbox
        let outputHTML = "";
        let id = "defaultEndTime";
        outputHTML += " / ";
        outputHTML += "<input type=\"text\" ";
        outputHTML += "id=\"" + id + "\" ";
        outputHTML += "value=\"" + this.getFormattedTime(this.defaultEndTime) + "\" ";
        outputHTML += "onfocusout=\"";
        outputHTML += "myGroup.updateDefaultTime(document.getElementById('" + id + "').value)";
        outputHTML += "\"";
        outputHTML += ">";
        return outputHTML;
    }
    updateDefaultTime (newTime) {
        this.defaultEndTime = this.parseTime(newTime);
        this.editDefaultEndTime = false;
        this.render();
    }
    getRenderHTML () {
        let outputHTML = "";
        const me = this;
        const htmlstrings = me.members.map(timer => timer.getRenderHTML());
        //const htmlstrings = this.members.map(timer => timer.getRenderHTML());
        if (htmlstrings.length > 0) {
            outputHTML = htmlstrings.reduce(this.combineHTMLstrings);
        }
        return outputHTML;
    }
    renderTotalTimeHTML () {
        let outputHTML = "";
        //outputHTML += this.renderBeginningHTML(); // render the beginning HTML
        outputHTML += this.renderTimeLeft();
        outputHTML += " ( ";
        outputHTML += this.membersElapsedTime();
        outputHTML += this.renderEndTime();
        outputHTML += " )";
        //outputHTML += this.renderEndingHTML(); // render the ending HTML
        return outputHTML;
    }
    renderBeginningHTML() {
        let outputHTML = "";
        outputHTML += "<li "
        //outputHTML += "class=\"" + classNames.TODO_ITEM + "\"";
        outputHTML += ">";
        return outputHTML;
    }
    renderEndingHTML() {
        let outputHTML = "";
        outputHTML += "</li>";
        return outputHTML;
    }
    renderTimeLeft() {
        let timeleft = 0;
        let keys = this.getKeys();
        for (const key in keys) {
            timeleft += this.members[key].timeLeft();
        }
        return this.getFormattedTime(timeleft);
    }
    membersElapsedTime() {
        let time = 0;
        let keys = this.getKeys();
        for (const key in keys) {
            time += this.members[key].elapsedTime;
        }
        return this.getFormattedTime(time);
    }
    renderEndTime() {
        let outputHTML = "";
        outputHTML += " / ";
        outputHTML += this.getFormattedTime(this.endTime());
        return outputHTML;
    }
    endTime () {
        let endTime = 0;
        const keys = this.getKeys();
        for (const key in keys) {
            endTime += this.members[key].endTime;
        }
        return endTime;
    }
    getFormattedTime(seconds) {
        let outputString = "";
        outputString += this.getMinutesFromSeconds(seconds);
        outputString += ":";
        outputString += this.getRemainderSeconds(seconds);
        return outputString;
    }
    getMinutesFromSeconds (seconds) {
        let minutes = Math.floor(seconds / 60);
        return minutes;
    }
    getRemainderSeconds(seconds) {
        let remainderSeconds = seconds % 60;
        if (remainderSeconds < 10) {
            remainderSeconds = "0" + remainderSeconds;
        }
        return remainderSeconds;
    }
    printActiveTimers () {
        let keys = this.getKeys();
        for (const key in keys) {
            console.log("Timer: " + key + " is active?" + this.members[key].active);
        }
    }

    bestToDoName (start) {
        let isOk = true;
        const keys = Object.keys(this.members);
        for (const key of keys) {
            if (this.members[key].name === "Timer " + start) {
                isOk = false;
            }
        }
        if (isOk) {
            return start;
        } else {
            return this.bestToDoName(parseInt(start) + 1)
        }
    }
    toggleCheck (name) {
        this.fetchMember(name).toggleCheck();
        uncheckedCountSpan.innerHTML = this.countUnChecked();
        this.render();
    }

    displayEditableTextBoxHTML (name) {
        this.fetchMember(name).toggleNameEdit();
        this.render();
        /*
        // Execute a function when the user releases a key on the keyboard
        this.document.getElementById(this.getTextboxName()).addEventListener("keyup", function(event) {
            // Number 13 is the "Enter" key on the keyboard
            if (event.keyCode === 13) {
                // Cancel the default action, if needed
                event.preventDefault();
                // Trigger the button element with a click
                document.getElementById("updateName" + this.getTextboxName()).click();
            }
        });
        */
    }
    displayEditableEndTimeBoxHTML (name) {
        this.fetchMember(name).toggleTimeEdit();
        this.render();
    }
    countUnChecked (arr) {
        let count = 0;
        const keys = this.getKeys();
        for (const key in keys) {
            if (!this.members[key].checked) {
                count++;
            }
        }
        return count;
    }
}

class Timer {
    constructor (configuration) {
        this.name = configuration.name || "new Timer";
        this.defaultEndTime = configuration.defaultEndTime || 60;
        this.endTime = configuration.endTime * 60 || ((configuration.endTimeMinutes)*60 + configuration.endTimeSeconds) || this.defaultEndTime; //end time in seconds
        this.elapsedTime = 0;
        this.active = configuration.active || false;
        this.editTime = false;
        this.elapsedTimeConversionFactor = 1;
        this.endTimeConversionFactor = 60;
        this.interval = 0;
        this.checked = false;
        this.editName = false;
    }
    alive () {
        let alive = false;
        if (this.active && !this.ended()) {
            //this.alive = true;
            alive = true;
        } else {
            //this.alive = false;
            alive = false;
        }
        //return this.alive;
        return alive;
    }
    timeLeft() {
        let timeleft = this.endTime - this.elapsedTime;
        if (timeleft < 0 ) {
            timeleft = 0;
        }
        return timeleft;
    }
    setName (name) {
        this.name = name;
    }
    setEndTime (time) {
        this.endTime = time;
        if (time < this.elapsedTime) {
            //this.elapsedTime = time;
        }
    }
    
    toggleCheck () {
        this.checked = !this.checked;
    }
    

    toggleNameEdit () {
        this.editName = !this.editName;
    }
    toggleTimeEdit () {
        this.editTime = !this.editTime;
    }

    getTextboxName() {
        let originalName = this.name;
        let textboxName = "memberTextbox " + originalName;
        return textboxName;
    }

    ended () {
        let ended = false;
        if (this.timeLeft() > 0) {
            ended = false;
        } else {
            ended = true;
        }
        return ended;
    }
    iterateTime() {
        if (!this.ended() && this.active) {
            this.elapsedTime++;
            this.render();
        }
    }
    
    startTimer() {
        this.active = true;
        // this.interval = setInterval(this.render(), 1000); // without a closure, does not work
        this.interval = setInterval(() => this.iterateTime(), 1000);
    }
    
    pauseTimer() {
        this.active = false;
        //this.interval = setInterval(() => this.render(), 1000);
        clearInterval(this.interval);
    }
    render () {
        if (!this.ended) {
            //list.innerHTML = this.getRenderHTML();
            list.innerHTML += this.getRenderHTML();
        } else {
            clearInterval(this.interval);
        }
        /*
        if (typeof arguments[0] == "object") {
            const id = arguments[0];
        } else {
            const id = "";
        }
        */
    }

    getRenderHTML () {
        let outputHTML = "";
        outputHTML += this.renderBeginningHTML(); // render the beginning HTML
        outputHTML += this.renderTimeLeft();
        outputHTML += " ( ";
        outputHTML += this.getFormattedTime(this.elapsedTime);
        outputHTML += this.renderEndTimeHTML();
        outputHTML += " )";
        outputHTML += this.renderCheckboxHTML();  // render the checkbox
        outputHTML += this.renderDeleteToDoButtonHTML() // render the ToDo delete button
        outputHTML += this.renderTextboxHTML();   // render the text and the textbox
        outputHTML += this.renderEndingHTML(); // render the ending HTML
        return outputHTML;
    }
    renderBeginningHTML() {
        let outputHTML = "";
        outputHTML += "<li "
        //outputHTML += "class=\"" + classNames.TODO_ITEM + "\"";
        outputHTML += ">";
        return outputHTML;
    }
    renderEndingHTML() {
        let outputHTML = "";
        outputHTML += "</li>";
        return outputHTML;
    }
    renderTimeLeft() {
        let outputHTML = "";
        let timeleft = this.timeLeft()
        if (timeleft >= 0) {
            outputHTML += this.getFormattedTime(timeleft);
        } else {
            outputHTML += "0:00";
        }
        return outputHTML;
    }
    renderEndTimeHTML() {
        let outputHTML = "";
        if (this.editTime) {
            //outputHTML += this.renderEditableTimeTextboxHTML() + this.renderUpdateToDoNameButtonHTML();
            outputHTML += this.renderEditableTimeTextboxHTML();
        } else {
            outputHTML += this.renderDisplayOnlyTimeTextboxHTML();
        }
        return outputHTML;
    }

    renderDisplayOnlyTimeTextboxHTML () {
        let outputHTML = "";
        outputHTML += " / ";
        outputHTML += "<span id=\"" + "EndTime" + this.getTextboxName() + "\"";
        outputHTML += "onClick=\"(function () {";
        outputHTML += "myGroup.displayEditableEndTimeBoxHTML('" + this.name + "'); ";
        //outputHTML += "document.getElementById(\"" + "EndTime" + this.getTextboxName() + "\").focus();";
        //outputHTML += "document.getElementById(\"" + "EndTime" + this.getTextboxName() + "\").select();";
        outputHTML += "})()";
        outputHTML += "\"";
        outputHTML += ">";
        outputHTML += this.getMinutesFromSeconds(this.endTime);
        outputHTML += ":";
        outputHTML += this.getRemainderSeconds(this.endTime);
        outputHTML += " ";
        outputHTML += "</span>";
        return outputHTML;
    }

    renderEditableTimeTextboxHTML () {
        // render the text and the textbox
        let outputHTML = "";
        outputHTML += " / ";
        outputHTML += "<input type=\"text\" ";
        outputHTML += "id=\"" + "EndTime" + this.getTextboxName() + "\" ";
        outputHTML += "value=\"" + this.getFormattedTime(this.endTime) + "\" ";
        outputHTML += "onfocusout=\"";
        outputHTML += "myGroup.updateTime('" + this.name + "', document.getElementById('" + "EndTime" + this.getTextboxName() + "').value)";
        outputHTML += "\"";
        outputHTML += ">";
        return outputHTML;
    }

    getFormattedTime(seconds) {
        let outputString = "";
        outputString += this.getMinutesFromSeconds(seconds);
        outputString += ":";
        outputString += this.getRemainderSeconds(seconds);
        return outputString;
    }

    getMinutesFromSeconds (seconds) {
        let minutes = Math.floor(seconds / 60);
        return minutes;
    }
    getRemainderSeconds (seconds) {
        let remainderSeconds = seconds % 60;
        if (remainderSeconds < 10) {
            remainderSeconds = "0" + remainderSeconds;
        }
        return remainderSeconds;
    }
    renderEllapsedTime() {
        let outputHTML = "";
        outputHTML += "<li>";
        outputHTML += String(this.endTimeConversionFactor);
        outputHTML += "</li>";
        list.innerHTML = outputHTML;
    }
    currentTime() {
        var d = new Date();
        var t = d.toLocaleTimeString();
        list.innerHTML = t;
    }
    
    renderCheckboxHTML() {
        let outputHTML = "";
        outputHTML += "<input type=\"checkbox\" class=\"" + classNames.TODO_CHECKBOX + "\" "
        if (this.checked) {
            outputHTML += "checked=" + this.checked + " ";
        }
        outputHTML += "onClick=\"";
        outputHTML += "myGroup.toggleCheck('" + this.name + "')";
        outputHTML += "\"";
        outputHTML += ">";
        return outputHTML;
    }

    renderTextboxHTML() {
        let outputHTML = "";
        if (this.editName) {
            outputHTML += this.renderEditableTextboxHTML() + this.renderUpdateToDoNameButtonHTML();
        } else {
            outputHTML += this.renderDisplayOnlyTextboxHTML();
        }
        return outputHTML;
    }

    renderDisplayOnlyTextboxHTML() {
        let outputHTML = "";
        outputHTML += "<span ";
        outputHTML += "class=\"" + classNames.TODO_TEXT + " ";
        outputHTML += "id=\"" + this.getTextboxName() + "\" ";
        outputHTML += "value=\"" + this.name + "\" ";
        
        outputHTML += "onClick=\"";
        outputHTML += "myGroup.displayEditableTextBoxHTML('" + this.name + "')";
        outputHTML += "\"";
        outputHTML += ">";
        outputHTML += this.name; 
        outputHTML += "</span>";
        return outputHTML;
    }

    renderEditableTextboxHTML() {
        let outputHTML = "";
        outputHTML += "<input type=\"text\" ";
        outputHTML += "id=\"" + this.getTextboxName() + "\" ";
        outputHTML += "value=\"" + this.name + "\" ";
        outputHTML += "onfocusout=\"";
        outputHTML += "myGroup.updateName('" + this.name + "', document.getElementById('" + this.getTextboxName() + "').value)";
        outputHTML += "\"";
        outputHTML += ">";
        return outputHTML;
    }

    renderUpdateToDoNameButtonHTML() {
        let outputHTML = "";
        outputHTML += "<input type=\"button\" name=\"updateTaskName" + this.name + "\" value=\"updateName\" ";
        outputHTML += "id=\"updateName" + this.getTextboxName() + "\" ";
        outputHTML += "onClick=\"";
        outputHTML += "myGroup.updateName('" + this.name + "', document.getElementById('" + this.getTextboxName() + "').value)";
        outputHTML += "\">";
        return outputHTML;
    }

    renderDeleteToDoButtonHTML() { 
        let outputHTML = "<input type=\"button\" class=\"" + classNames.TODO_DELETE + "\" ";
        outputHTML += "value=\"Delete\" ";
        outputHTML += "onClick=\"";
        outputHTML += "myGroup.delete(\'" + this.name + "\')";
        outputHTML += "\">";
        return outputHTML;
    }
}

let myTimer0 = new Timer({name: 'Countdown', endTimeMinutes: 0, endTimeSeconds: 2, active: false});
let myTimer1 = new Timer({name: 'Warmup', endTimeMinutes: 0, endTimeSeconds: 30, active: false});
let myTimer2 = new Timer({name: 'Task 0', endTimeMinutes: 2, endTimeSeconds: 0, active: false});
let myTimer3 = new Timer({name: 'Task 1', endTimeMinutes: 1, endTimeSeconds: 0, active: false});
let myTimer4 = new Timer({name: 'Cooldown', endTimeMinutes: 0, endTimeSeconds: 2, active: false});

// Push members onto an array
let myGroup = new TimerGroup(myTimer0);
myGroup.add(myTimer1);
myGroup.add(myTimer2);
myGroup.add(myTimer3);
myGroup.add(myTimer4);

myGroup.render();

function startTimer() {
    myGroup.toggleTimer();
}

function resetTimer() {
    myGroup.fullReset();
}

function newTimer() {
    myGroup.add(new Timer({name: "Timer " + myGroup.bestToDoName(0), active: false, defaultEndTime: myGroup.defaultEndTime}));
    myGroup.render();
}

function makeFloatingControlsContainer() {
    
    //if ( document.getElementById("control-timers").classList.contains('floating-container') ) {
      //  document.getElementById("control-timers").classList.remove('floating-container');
    //}

    /*
    if ( document.getElementById("timersBox").classList.contains('floating-timer-list') ) {
        document.getElementById("timersBox").classList.remove('floating-timer-list');
    }
    */
    /*
    if ( document.getElementById("pomodoro-timer").classList.contains('floating-timer-list') ) {
        document.getElementById("pomodoro-timer").classList.remove('floating-timer-list');
    }
    */
    /*
    if ( document.getElementById("pomodoro-timer").classList.contains('ul-center') ) {
        document.getElementById("pomodoro-timer").classList.remove('ul-center');
    }
    */
    /*
    if (document.getElementById("pomodoro-timer").hasAttribute("width")) {
        document.getElementById("pomodoro-timer").removeAttribute("width");
    }
    */
    //if (document.getElementById("timersBox").style.left === "100px") {
    //    document.getElementById("timersBox").style.left = "auto";
    //}
    
    //if (document.getElementById("pomodoro-timer").style.right === "10px") {
    //  document.getElementById("pomodoro-timer").style.right = "auto";
    //}
    /*
    if ( document.getElementById("control-timers").style.left === "10px" ) {
        document.getElementById("control-timers").style.left = "auto";
    }
    */
    if (window.innerWidth > 1000) {
        document.getElementById("control-timers").style.position = "fixed";
        document.getElementById("control-timers").style.top = "150px";
        document.getElementById("control-timers").style.left = "10px";
        document.getElementById("control-timers").style.zIndex = "2";
        document.getElementById("control-timers").style.width = "100px";
        document.getElementById("control-timers").style.border = "solid thin red";
        //document.getElementById("control-timers").style.margin = "auto";
        document.getElementById("control-timers").style.display = "";
        document.getElementById("control-timers").style.justifyContent = "";
        //document.getElementById("control-timers").style.verticalAlign = "middle";
        //document.getElementById("control-timers").style.display = "table-cell";

        document.getElementById("pomodoro-timer").style.position = "absolute";
        document.getElementById("pomodoro-timer").style.left = "110px";
        //document.getElementById("pomodoro-timer").style.right = "110px";
        document.getElementById("pomodoro-timer").style.zIndex = "1";
        //document.getElementById("control-timers").style.width = "100px";

        //document.getElementById("myDIV").style.left = "-30px";
        //document.getElementById("control-timers").classList.add('floating-container');
        //document.getElementById("timersBox").classList.add('floating-timer-list');
        //document.getElementById("pomodoro-timer").setAttribute("width", "55rem")
        //document.getElementById("pomodoro-timer").style.right = "10px";
        //document.getElementById("timersBox").style.left = "100px";
        //document.getElementById("pomodoro-timer").classList.add('floating-timer-list');
        //document.getElementById("pomodoro-timer").classList.add('ul-center');
    } else {
        document.getElementById("control-timers").style.position = "relative";
        document.getElementById("control-timers").style.top = "auto";
        document.getElementById("control-timers").style.left = "auto";
        document.getElementById("control-timers").style.zIndex = "1";
        document.getElementById("control-timers").style.width = "";
        document.getElementById("control-timers").style.border = "";
        document.getElementById("control-timers").style.display = "flex";
        document.getElementById("control-timers").style.justifyContent = "center";

        document.getElementById("pomodoro-timer").style.position = "relative";
        document.getElementById("pomodoro-timer").style.left = "auto";
        //document.getElementById("pomodoro-timer").style.right = "auto";
        document.getElementById("pomodoro-timer").style.zIndex = "1";
        //document.getElementById("control-timers").style.verticalAlign = "";
    }
}