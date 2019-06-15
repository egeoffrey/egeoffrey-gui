// handle top-right notification widget

class Notifications extends Widget {
    constructor(id) {
        super(id, {})
    }
    
    // draw the widget's content
    draw() {
        // ask for the old alerts
        for (var severity of ["info", "warning", "alert"]) {
            var message = new Message(gui)
            message.recipient = "controller/db"
            message.command = "TAIL_ALERTS"
            message.args = severity
            message.set_data(5)
            gui.sessions.register(message, {
            })
            this.send(message)
        }
        // subscribe for new alert
        this.listener = this.add_broadcast_listener("controller/alerter", "NOTIFY", "#")
    }
    
    // close the widget
    close() {
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
        else if (message.sender == "controller/db" && message.command == "TAIL_ALERTS") {
            var severity = message.args
            var data = message.get_data()
            var widget = "#notification_"+severity;
            var widget_counter = "#notification_"+severity+"_count"
            // empty the widget
            $(widget).empty()
            $(widget_counter).html("")
            // set the counter
            if (data.length > 0) $(widget_counter).html(data.length)
            // for each alert, add it to the list
            for (var entry of data) {
                $(widget).prepend('<li><a title="'+entry[1]+'">'+entry[1]+'</a></li>')
            }
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}