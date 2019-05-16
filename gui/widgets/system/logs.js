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
                    <tr><th>Module</th><th>Severity</th><th>Message</th></tr>\
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
            "autoWidth": true,
        };
        // create the table
        $("#"+this.id+"_table").DataTable(options);
        // subscribe for logs
        // subscribe for acknoledgments from the database for saved values
        this.add_inspection_listener("+/+", "controller/logger", "LOG", "#")
    }
    
        
    // close the widget
    close() {
    }    
    
    // receive data and load it into the widget
    on_message(message) {
        if (message.sender == "controller/logger") {
            var table = $("#"+this.id+"_table").DataTable()
            table.row.add([message.sender, message.args, message.get_data()]).draw();
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}