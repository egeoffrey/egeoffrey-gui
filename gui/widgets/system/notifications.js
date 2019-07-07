// Notification widget
class Notifications extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.listener = null
        this.filter_by = null
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _table, _selector
        // if refresh requested, we need to unsubscribe from the topics to receive them again
        if (this.listener != null) this.remove_listener(this.listener)
        if (location.hash.includes("=")) {
            var request = location.hash.split("=")
            this.filter_by = request[1]
        }
        var body = "#"+this.id+"_body"
        $(body).html("")
        // add selector
        var selector = '\
            <div class="form-group">\
                <select class="form-control" id="'+this.id+'_selector">\
                    <option value="">All</option>\
                    <option value="INFO">Info</option>\
                    <option value="WARNING">Warning</option>\
                    <option value="ALERT">Alert</option>\
                </select>\
            </div>'
        $(body).append(selector)
        // configure selector
        $("#"+this.id+"_selector").unbind().change(function(this_class) {
            return function () {
                var request = $("#"+this_class.id+"_selector").val()
                var table = $("#"+this_class.id+"_table").DataTable()
                table.column(1).search(request).draw()
            };
        }(this));
        // add table
        var table = '\
            <table id="'+this.id+'_table" class="table table-bordered table-striped">\
                <thead>\
                    <tr><th>Time</th><th>Severity</th><th>Message</th></tr>\
                </thead>\
                <tbody></tbody>\
            </table>'
        $(body).append(table)
        // how to render the timestamp
        function render_timestamp(data, type, row, meta) {
            if (type == "display") return gui.date.format_timestamp(data)
            else return data
        };
        // define datatables options
        var options = {
            "responsive": true,
            "dom": "Zlfrtip",
            "fixedColumns": false,
            "paging": true,
            "lengthChange": false,
            "searching": true,
            "ordering": true,
            "info": true,
            "autoWidth": false,
            "order": [[ 0, "desc" ]],
            "columnDefs": [
                {
                    "targets" : 0,
                    "render": render_timestamp,
                },
                {
                    "className": "dt-center",
                    "targets": [0, 1]
                }
            ],
            "language": {
                "emptyTable": '<span id="'+this.id+'_table_text"></span>'
            }
        };
        // create the table
        $("#"+this.id+"_table").DataTable(options);
        $("#"+this.id+"_table_text").html('<i class="fas fa-spinner fa-spin"></i> Loading')
        // ask for the old alerts
        for (var severity of ["info", "warning", "alert"]) {
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
        // subscribe for new alert
        this.listener = this.add_broadcast_listener("controller/alerter", "NOTIFY", "#")
    }
    
    // format the severity
    format_severity(severity) {
        severity = severity.toUpperCase()
        if (severity == "INFO") return "<b>"+severity+"</b>"
        else if (severity == "WARNING") return '<p style="color:orange"><b>'+severity+"</b></p>"
        else if (severity == "ALERT") return '<p style="color:red"><b>'+severity+"</b></p>"
    }
    
    // receive data and load it into the widget
    on_message(message) {
        var table = $("#"+this.id+"_table").DataTable()
        // realtime alerts
        if (message.sender == "controller/alerter" && message.command == "NOTIFY") {
            var args = message.args.split("/")
            table.row.add([gui.date.now(), this.format_severity(args[0]), message.get_data()]).draw(false);
        }
        else if (message.sender == "controller/db" && message.command == "GET") {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            for (var entry of data) {
                table.row.add([entry[0]/1000, this.format_severity(message.args), entry[1]]);
            }
            table.draw()
            if (table.data().count() == 0) $("#"+this.id+"_table_text").html('No data to display')
        }
        if (this.filter_by != null) {
            $("#"+this.id+"_selector").val(this.filter_by)
            table.column(1).search(this.filter_by).draw();
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}