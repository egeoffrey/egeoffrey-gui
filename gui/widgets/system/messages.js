// Messages widget
class Messages extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.listener = null
        this.filter_by = null
        // add an empty box into the given column
        this.template.add_large_widget(this.id, this.widget["title"])
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _table, _selector
        // if refresh requested, we need to unsubscribe from the topics to receive them again
        if (this.listener != null) gui.remove_listener(this.listener)
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
                table.column(1).search(request).draw();
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
                    "className": "dt-center",
                    "targets": [0, 1]
                }
            ]
        };
        // create the table
        $("#"+this.id+"_table").DataTable(options);
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
        gui.remove_listener(this.listener)
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
            table.row.add([gui.date.format_timestamp(), this.format_severity(args[0]), message.get_data()]).draw(false);
        }
        else if (message.sender == "controller/db" && message.command == "TAIL_ALERTS") {
            for (var entry of message.get_data()) {
                table.row.add([gui.date.format_timestamp(entry[0]), this.format_severity(message.args), entry[1]]);
            }
            table.draw()
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