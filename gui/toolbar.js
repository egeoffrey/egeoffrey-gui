// handle top-right notification widget

class Toolbar extends Widget {
    constructor(id) {
        super(id, {})
        this.persistent = true
    }
    
    // draw the widget's content
    draw() {
        // ask for the old alerts
        for (var severity of ["info", "warning", "alert"]) {
            // set the link to the widget
            $("#notification_"+severity+"_link").attr("href", "#"+gui.settings["notification_page"]+"="+severity.toUpperCase())
            // retrieve the data from the database
            var message = new Message(gui)
            message.recipient = "controller/db"
            message.command = "GET"
            message.args = severity
            message.set("timeframe", "last_5_days")
            message.set("scope", "alerts")
            message.set("max_items", 500)
            gui.sessions.register(message, {
            })
            this.send(message)
        }
        // ask for old logs
        for (var severity of ["value"]) {
            // set the link to the widget
            $("#notification_"+severity+"_link").attr("href", "#"+gui.settings["log_page"]+"="+severity.toUpperCase())
            // retrieve the data from the database
            var message = new Message(gui)
            message.recipient = "controller/db"
            message.command = "GET"
            message.args = severity
            message.set("timeframe", "last_5_days")
            message.set("scope", "logs")
            message.set("max_items", 500)
            gui.sessions.register(message, {
            })
            this.send(message)
        }
        // subscribe for new alert
        this.add_broadcast_listener("controller/alerter", "NOTIFY", "#")
        // subscribe for new logs
        this.add_inspection_listener("+/+", "controller/logger", "LOG", "value")
    }
    
    // receive data and load it into the widget
    on_message(message) {
        // realtime alerts
        if (message.sender == "controller/alerter" && message.command == "NOTIFY") {
            var severity = message.args.split("/")[0]
            var alert_text = message.get_data()
            var widget = "#notification_"+severity;
            var widget_counter = "#notification_"+severity+"_count"
            // increase the counter
            var counter = $(widget_counter).html()
            counter++
            $(widget_counter).html(counter)
            // add the alert to the list
            $(widget).prepend('<li><a title="'+alert_text+'">'+alert_text+'</a></li>')
            // notify the user
            var color = severity
            if (severity == "alert") color = "danger"
            if (severity == "info") color = "success"
            gui.notify(color, alert_text)
        }
        // realtime logs
        if (message.recipient == "controller/logger" && message.command == "LOG") {
            var text = message.get_data()
            // clean up the log text
            var match = text.match(/"(.+)": (.+)$/)
            if (match == null) return
            text = match[1]+": "+match[2]
            var widget = "#notification_"+severity;
            var widget_counter = "#notification_"+severity+"_count"
            // increase the counter
            var counter = $(widget_counter).html()
            counter++
            $(widget_counter).html(counter)
            // add the line to the list
            $(widget).prepend('<li><a title="'+text+'">'+text+'</a></li>')
            // notify the user
            gui.notify("info", text)
        }
        else if (message.sender == "controller/db" && message.command == "GET") {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            var severity = message.args
            var widget = "#notification_"+severity;
            var widget_counter = "#notification_"+severity+"_count"
            // empty the widget
            $(widget).empty()
            $(widget_counter).html("")
            // set the counter
            if (data.length > 0) $(widget_counter).html(data.length)
            // for each alert, add it to the list
            for (var entry of data) {
                var text = entry[1]
                if (severity == "value") {
                    // clean up the log text
                    var match = text.match(/\[([^\]]+)\] "(.*)": (.+)$/)
                    if (match == null) continue
                    text = match[2] == "" ? match[1]+": "+match[3] : text = match[2]+": "+match[3]
                }
                $(widget).prepend('<li><a title="'+text+'">'+text+'</a></li>')
            }
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}