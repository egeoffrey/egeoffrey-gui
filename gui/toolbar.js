// handle top-right notification widget

class Toolbar extends Widget {
    constructor(id) {
        super(id, {})
        this.persistent = true
        this.notification_value_enabled = false
    }
    
    // draw the widget's content
    draw() {
        // ask for the old alerts
        for (var severity of ["info", "warning", "alert", "value"]) {
            // set the link to the widget
            $("#notification_"+severity+"_link").attr("href", "#__notifications"+"="+severity.toUpperCase())
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
        if (this.notification_value_enabled) $("#notification_value_enabled").iCheck('check')
        $("#notification_value_enabled").unbind().on('ifChanged',function(this_class) {
            return function () {
                this_class.notification_value_enabled = this.checked
            };
        }(this));
        // subscribe for new alert
        this.add_broadcast_listener("+/+", "NOTIFY", "#")
        // ask for manifest files needed for notifying about available updates
        this.add_broadcast_listener("+/+", "MANIFEST", "#")
    }
        
    // receive data and load it into the widget
    on_message(message) {
        // realtime alerts
        if (message.recipient == "*/*" && message.command == "NOTIFY") {
            var severity = message.args.split("/")[0]
            if (severity == "value" && ! $("#notification_value_enabled").prop('checked')) return
            var alert_text = message.get_data()
            var widget = "#notification_"+severity;
            var widget_counter = "#notification_"+severity+"_count"
            // increase the counter
            var counter = parseInt($(widget_counter).html())+1
            $(widget_counter).html(counter)
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
        // manifest file - check for updates
        else if (message.command == "MANIFEST") {
            var manifest = message.get_data()
            if (manifest["manifest_schema"] != gui.supported_manifest_schema) return
            // set gui version
            if (manifest["package"] == "myhouse-gui") $("#version").html(manifest["version"].toFixed(1)+"-"+manifest["revision"]+" ("+manifest["branch"]+")")
            // check for update
            var url = "https://raw.githubusercontent.com/"+manifest["github"]+"/"+manifest["branch"]+"/manifest.yml?timestamp="+new Date().getTime()
            $.get(url, function(data) {
                var remote_manifest = jsyaml.load(data)
                if (remote_manifest["manifest_schema"] != gui.supported_manifest_schema) return
                if (remote_manifest["version"] > manifest["version"] || (remote_manifest["version"] == manifest["version"] && remote_manifest["revision"] > manifest["revision"])) gui.notify("info", "A new version of "+manifest["package"]+" is available")
            });
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}