// rules widget
class Rules extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.rules = {}
        this.listener = null
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _table
        // if refresh requested, we need to unsubscribe from the topics to receive them again
        if (this.listener != null) {
            this.remove_listener(this.listener)
            this.rules = {}
        }
        var body = "#"+this.id+"_body"
        $(body).html("")
        // add new rule button
        var button_html = '\
            <div class="form-group">\
                <button type="button" id="'+this.id+'_new" class="btn btn-block btn-primary btn-lg"><i class="fas fa-plus"></i> Add a new rule</button>\
            </div>'
        $(body).append(button_html)
        $("#"+this.id+"_new").unbind().click(function() {
            return function () {
                window.location.hash = '#__rule_wizard'
            };
        }());
        // add table
        // 0: rule_id (hidden)
        // 1: rule
        // 2: severity
        // 3: type
        // 4: for
        // 5: conditions
        // 6: actions
        // 7: control
        var table = '\
            <table id="'+this.id+'_table" class="table table-bordered table-striped">\
                <thead>\
                    <tr><th>_rule_id_</th><th>Rule</th><th>Severity</th><th>Type</th><th>For</th><th>Conditions</th><th>Actions</th><th>Control</th></tr>\
                </thead>\
                <tbody></tbody>\
            </table>'
        $(body).append(table)
        // define datatables options
        var options = {

            "responsive": true,
            "dom": "Zlfrtip",
            "fixedColumns": false,
            "paging": false,
            "lengthChange": false,
            "searching": true,
            "ordering": true,
            "info": true,
            "autoWidth": false,
            "columnDefs": [ 
                {
                    "targets" : [0],
                    "visible": false,
                },
                {
                    "targets" : [7],
                    "width": 110,
                },
                {
                    "className": "dt-center", 
                    "targets": [2, 7]
                }
            ],
            "language": {
                "emptyTable": '<span id="'+this.id+'_table_text"></span>'
            }
        };
        // create the table
        if (! $.fn.dataTable.isDataTable("#"+this.id+"_table")) {
            $("#"+this.id+"_table").DataTable(options);
        } else {
            var table = $("#"+this.id+"_table").DataTable()
            table.clear()
        }
        $("#"+this.id+"_table_text").html('<i class="fas fa-spinner fa-spin"></i> Loading')
        // discover registered rules
        this.listener = this.add_configuration_listener("rules/#", gui.supported_rules_config_schema)
    }
    
    // receive data and load it into the widget
    on_message(message) {
    }
    
    // if the item is disabled, gray out the text
    disabled_item(item, disabled) {
        if (! disabled) return item
        if (typeof item === 'object' && item.constructor === Array) {
            for (var i = 0; i < item.length; i++) item[i] = '<p class="text-muted">'+item[i]+'</p>'
            return item
        }
        else return '<p class="text-muted">'+item+'</p>'
    }
    
    // format an object for displaying
    format_object(object) {
        return "- "+JSON.stringify(object).replaceAll("{","").replaceAll("}","").replaceAll("\"","").replaceAll(":",": ").replaceAll(",","<br>- ")
    }
    
    // receive configuration
    on_configuration(message) {
        var rule_id = message.args.replace("rules/","")
        // skip rules already received
        if (rule_id in this.rules) return
        var rule = message.get_data()
        var rule_tag = rule_id.replaceAll("/","_")
        this.rules[rule_id] = rule
        // add a line to the table
        var table = $("#"+this.id+"_table").DataTable()
        var disabled = "disabled" in rule && rule["disabled"]
        var description = "<b>"+rule["text"]+"</b><br>("+rule_id+")"
        var type = ""
        if (rule["type"] == "recurrent") type = '<i class="fas fa-calendar-alt fa-2x"></i><br>'+this.format_object(rule["schedule"])
        else if (rule["type"] == "on_demand") type = '<i class="fas fa-sliders-h fa-2x"></i>'
        else if (rule["type"] == "realtime") type = '<i class="fas fa-magic fa-2x"></i>'
        var conditions = ""
        for (var i = 0; i < rule["conditions"].length; i++) {
            var or_condition = rule["conditions"][i]
            for (var and_condition of or_condition) {
                conditions = conditions+and_condition+"<br>"
            }
            if (i != rule["conditions"].length-1) conditions = conditions+"OR<br>"
        }
        var actions = ""
        if ("actions" in rule) {
            for (var action of rule["actions"]) actions = actions+action+"<br>"
        }
        var for_i = ""
        if ("for" in rule) {
            for (var i of rule["for"]) for_i = for_i+i+"<br>"
        }
        var run_html = '<button type="button" id="'+this.id+'_run_'+rule_tag+'" class="btn btn-default"><i class="fas fa-play"></i></button>'
        var edit_html = '<button type="button" id="'+this.id+'_edit_'+rule_tag+'" class="btn btn-default"><i class="fas fa-edit"></i></button>'
        var delete_html = '<button type="button" id="'+this.id+'_delete_'+rule_tag+'" class="btn btn-default" ><i class="fas fa-trash"></i></button>'
        // add the row
        table.row.add(this.disabled_item([rule_id, format_multiline(description, 50), rule["severity"] , type, for_i, conditions, format_multiline(actions, 30), run_html+" "+edit_html+" "+delete_html], disabled)).draw(false);
        if (table.data().count() == 0) $("#"+this.id+"_table_text").html('No data to display')
        // run the selected rule
        $("#"+this.id+"_run_"+rule_tag).unbind().click(function(rule_id) {
            return function () {
                var message = new Message(gui)
                message.recipient = "controller/alerter"
                message.command = "RUN"
                message.args = rule_id
                gui.send(message)
                gui.notify("info", "Requesting to run the rule "+rule_id)
            };
        }(rule_id));
        // edit the selected rule
        $("#"+this.id+"_edit_"+rule_tag).unbind().click(function(rule_id) {
            return function () {
                window.location.hash = '#__rule_wizard='+rule_id;
            };
        }(rule_id));
        // delete the rule
        $("#"+this.id+"_delete_"+rule_tag).unbind().click(function(rule_id) {
            return function () {
                gui.confirm("Do you really want to delete rule "+rule_id+"?", function(result){ 
                    if (! result) return
                    // delete the rule configuration file
                    var message = new Message(gui)
                    message.recipient = "controller/config"
                    message.command = "DELETE"
                    message.args = "rules/"+rule_id
                    gui.send(message)
                    gui.notify("info", "Requesting to delete rule "+rule_id)
                });
            };
        }(rule_id));
        // disable run if rule is disabled
        if (disabled) $("#"+this.id+"_run_"+rule_tag).prop('disabled', true);
    }
}