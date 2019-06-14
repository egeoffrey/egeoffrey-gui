// Logs widget
class Logs extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.listener = null
        // add an empty box into the given column
        this.template.add_large_widget(this.id, this.widget["title"])
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _table
        // if refresh requested, we need to unsubscribe from the topics to receive them again
        if (this.listener != null) gui.remove_listener(this.listener)
        var body = "#"+this.id+"_body"
        // add table
        var table = '\
            <table id="'+this.id+'_table" class="table table-bordered table-striped">\
                <thead>\
                    <tr><th>Time</th><th>Severity</th><th>Message</th></tr>\
                </thead>\
                <tbody></tbody>\
            </table>'
        $(body).html(table)
        
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
        // ask for the old logs
        for (var severity of ["debug", "info", "warning", "error"]) {
            var message = new Message(gui)
            message.recipient = "controller/db"
            message.command = "TAIL_LOGS"
            message.args = severity
            message.set_data(5)
            gui.sessions.register(message, {
            })
            this.send(message)
        }
        // subscribe for new logs
        this.listener = this.add_inspection_listener("+/+", "controller/logger", "LOG", "#")
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
        else if (severity == "ERROR") return '<p style="color:red"><b>'+severity+"</b></p>"
    }
    
    // receive data and load it into the widget
    on_message(message) {
        // realtime logs
        if (message.recipient == "controller/logger") {
            var table = $("#"+this.id+"_table").DataTable()
            table.row.add([gui.date.format_timestamp(), this.format_severity(message.args), "["+message.sender+"] "+message.get_data()]).draw(false);
        }
        else if (message.sender == "controller/db" && message.command == "TAIL_LOGS") {
            var table = $("#"+this.id+"_table").DataTable()
            for (var entry of message.get_data()) {
                table.row.add([gui.date.format_timestamp(entry[0]), this.format_severity(message.args), entry[1]]);
            }
            table.draw()
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}