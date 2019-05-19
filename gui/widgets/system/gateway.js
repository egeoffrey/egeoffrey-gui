// Gateway widget
class Gateway extends Widget {
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
        if (this.listener != null) gui.remove_listener(this.listener)
        var body = "#"+this.id+"_body"
        // add table
        // 0: timestamp
        // 1: source
        // 2: recipient
        // 3: command
        // 4: args
        // 5: retain
        // 6: content
        var table = '\
            <table id="'+this.id+'_table" class="table table-bordered table-striped">\
                <thead>\
                    <tr><th>Time</th><th>Source Module</th><th>Recipient Module</th><th>Command</th><th>Args</th><th>Retain</th><th>Content</th></tr>\
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
                    "targets": [1, 2, 3, 5]
                }
            ]
        };
        // create the table
        $("#"+this.id+"_table").DataTable(options);
        // subscribe for all topics
        this.listener = this.add_inspection_listener("+/+", "+/+", "+", "#")
    }
    
        
    // close the widget
    close() {
        gui.remove_listener(this.listener)
    }    
    
    // receive data and load it into the widget
    on_message(message) {
        var table = $("#"+this.id+"_table").DataTable()
        var retain = message.retain ? '<i class="fas fa-check"></i>' : ""
        var content = truncate(format_multiline(JSON.stringify(message.get_data()), 70),1000)
        table.row.add([gui.date.format_timestamp(), message.sender, message.recipient, message.command, message.args, retain, content])
        table.draw(false)
    }
    
    // receive configuration
    on_configuration(message) {
    }
}