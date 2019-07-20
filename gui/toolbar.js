// handle top-right notification widget

class Toolbar extends Widget {
    constructor(id) {
        super(id, {})
        this.persistent = true
        this.notification_value_enabled = true
    }
    
    // draw the widget's content
    draw() {
        // ask for the old alerts
        for (var severity of ["info", "warning", "alert", "value"]) {
            // set the link to the widget
            $("#notification_"+severity+"_link").attr("href", "#"+gui.settings["notification_page"]+"="+severity.toUpperCase())
            // retrieve the counter from the database
            var message = new Message(gui)
            message.recipient = "controller/db"
            message.command = "GET_COUNT"
            message.args = severity
            message.set("timeframe", "last_24_hours")
            message.set("scope", "alerts")
            gui.sessions.register(message, {
            })
            this.send(message)
        }
        $("#notification_value_enabled").iCheck('check')
        $("#notification_value_enabled").unbind().on('ifChanged',function(this_class) {
            return function () {
                this_class.notification_value_enabled = this.checked
            };
        }(this));
        // subscribe for new alert
        this.add_broadcast_listener("+/+", "NOTIFY", "#")
    }
        
    // receive data and load it into the widget
    on_message(message) {
        // realtime alerts
        if (message.recipient == "*/*" && message.command == "NOTIFY") {
            var severity = message.args.split("/")[0]
            if (severity == "value" && ! this.notification_value_enabled) return
            var alert_text = message.get_data()
            var widget = "#notification_"+severity;
            var widget_counter = "#notification_"+severity+"_count"
            // increase the counter
            var counter = $(widget_counter).html()
            // add the alert to the list
            $(widget).prepend('<li><a title="'+alert_text+'">'+alert_text+'</a></li>')
            // remove the oldest one
            $(widget+" li:last").remove()
            // notify the user
            var color = severity
            if (severity == "alert") color = "danger"
            if (severity == "info") color = "success"
            if (severity == "value") color = "info"
            gui.notify(color, alert_text)
        }
        // last 24 hours counter
        else if (message.sender == "controller/db" && message.command == "GET_COUNT") {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            var severity = message.args
            var widget_counter = "#notification_"+severity+"_count"
            var count = data[0]
            // set the counter
            $(widget_counter).html(data[0])
            // retrieve the most recent items from the database
            var message = new Message(gui)
            message.recipient = "controller/db"
            message.command = "GET"
            message.args = severity
            message.set("start", -count)
            message.set("end", -1)
            message.set("scope", "alerts")
            gui.sessions.register(message, {
            })
            this.send(message)
        }
        // latest notifications
        else if (message.sender == "controller/db" && message.command == "GET") {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            var severity = message.args
            var widget = "#notification_"+severity
            for (var entry of data) {
                $(widget).prepend('<li><a title="'+entry+'">'+entry+'</a></li>')
            }
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}