// modules widget
class Modules extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.ping = {}
        this.indexes = []
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // set the status to given module_id
    set_status(module, status) {
        var module_id = module.replace("/","_")
        if (status == 1) {
            $("#"+this.id+"_start_"+module_id).prop('disabled', true)
            $("#"+this.id+"_stop_"+module_id).prop('disabled', false)
            $("#"+this.id+"_restart_"+module_id).prop('disabled', false)
            $("#"+this.id+"_running_"+module_id).addClass("fas fa-check")
        }
        else {
            $("#"+this.id+"_start_"+module_id).prop('disabled', false)
            $("#"+this.id+"_stop_"+module_id).prop('disabled', true)
            $("#"+this.id+"_restart_"+module_id).prop('disabled', true)
            $("#"+this.id+"_running_"+module_id).removeClass("fas fa-check")
        }
    }
    
    // request the data
    request_data() {
        // subscribe for start/stop notifications
        this.add_inspection_listener("+/+", "*/*", "STATUS", "#")
        // subscribe for ping responses
        this.add_inspection_listener("+/+", "+/+", "PONG", "#")
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _table
        var body = "#"+this.id+"_body"
        $(body).html("")
        // add table
        // 0: module
        // 1: type
        // 2: watchdog (hidden)
        // 3: version
        // 4: running
        // 5: configured
        // 6: ping
        // 7: debug
        // 8: actions
        var table = '\
            <table id="'+this.id+'_table" class="table table-bordered table-striped">\
                <thead>\
                   <tr><th data-priority="1">Name</th><th>Type</th><th>Watchdog</th><th>Version</th><th data-priority="1">Running</th><th>Configured</th><th>Ping</th><th>Debug</th><th data-priority="2">Actions</th></tr>\
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
                    "className": "dt-center",
                    "targets": [1, 3, 4, 5, 6, 7, 8]
                },
                {
                    "targets" : [2],
                    "visible": false,
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
        this.request_data()
        // ask for manifest files
        this.add_broadcast_listener("+/+", "MANIFEST", "#")
    }
    
    // receive data and load it into the widget
    on_message(message) {
        // a module is changing status
        if (message.command == "STATUS") {
            if (message.sender.startsWith("system")) return
            this.set_status(message.sender, message.args)
            if (message.args == 1) gui.notify("success", message.sender+" has started")
            else gui.notify("success", message.sender+" has stopped")
        }
        // receiving a manifest
        if (message.command == "MANIFEST") {
            // discover modules of this watchdog
            var discover_message = new Message(gui)
            discover_message.recipient = message.sender
            discover_message.command = "DISCOVER"
            discover_message.args = "*"
            this.indexes = []
            this.send(discover_message)
        }
        // received a ping response
        else if (message.command == "PONG") {
            var latency = ((new Date()).getTime()-this.ping[message.sender])/1000
            $("#"+this.id+"_ping_"+message.sender.replace("/","_")).html(latency+"s")

        }
        // received a discover response
        else if (message.command == "DISCOVER") {
            // for each module managed by the watchdog
            var watchdog = message.sender
            for (var module of message.get_data()) {
                // prevent adding the same module twice
                if (this.indexes.includes(watchdog+"|"+module["fullname"])) continue
                this.indexes.push(watchdog+"|"+module["fullname"])
                // add a row to the table with the discovered module
                var table = $("#"+this.id+"_table").DataTable()
                var module_id = module["scope"]+'_'+module["name"]
                var type = "question"
                if (module["scope"] == "controller") type = "gamepad"
                else if (module["scope"] == "notification") type = "bell"
                else if (module["scope"] == "interaction") type = "comment"
                else if (module["scope"] == "service") type = "exchange-alt"
                var version = module["version"]
                var running_icon = '<i id="'+this.id+'_running_'+module_id+'" class="" style="color: green;"></i>'
                var configured_icon = '<i id="'+this.id+'_configured_'+module_id+'" class="" style="color: green;"></i>'
                var debug_html = '<input id="'+this.id+'_debug_'+module_id+'" type="checkbox">'
                var set_html = module["scope"] == "notification" ? '<div class="input-group margin"><input type="text" id="'+this.id+'_set_text_'+module_id+'" class="form-control"><span class="input-group-btn"><button type="button" id="'+this.id+'_set_'+module_id+'" class="btn btn-default" ><span class="fas fa-sign-out-alt"></span></button></span></div><br>' : ""
                var edit_html = '<button type="button" id="'+this.id+'_edit_'+module_id+'" class="btn btn-default"><i class="fas fa-edit"></i></button>'
                var start_html = '<button type="button" id="'+this.id+'_start_'+module_id+'" class="btn btn-default" disabled><i class="fas fa-play"></i></button>'
                var stop_html = '<button type="button" id="'+this.id+'_stop_'+module_id+'" class="btn btn-default" disabled><i class="fas fa-stop"></i></button>'
                var restart_html = '<button type="button" id="'+this.id+'_restart_'+module_id+'" class="btn btn-default" disabled><i class="fas fa-sync"></i></button>'
                var table_options = [
                    module["fullname"], 
                    '<i class="fas fa-2x fa-'+type+'"></i>',
                    watchdog, 
                    version, 
                    running_icon, 
                    configured_icon, 
                    '<span id="'+this.id+'_ping_'+module_id+'"></span>', 
                    debug_html, 
                    set_html+edit_html+ " "+start_html+" "+stop_html+" "+restart_html 
                ]
                table.row.add(table_options).draw();
                table.responsive.recalc()
                if (table.data().count() == 0) $("#"+this.id+"_table_text").html('No data to display')
                // set the debug checkbox
                $("#"+this.id+"_debug_"+module_id).prop('checked', module["debug"])
                // set configured checkbox
                if (module["configured"]) $("#"+this.id+"_configured_"+module_id).addClass("fas fa-check")
                // when the debug checkbox changes, send a message to the module's watchdog
                $("#"+this.id+"_debug_"+module_id).iCheck({
                  checkboxClass: 'icheckbox_square-blue',
                  radioClass: 'iradio_square-blue',
                  increaseArea: '20%' 
                });
                $("#"+this.id+"_debug_"+module_id).unbind().on('ifChanged',function(module, watchdog) {
                    return function () {
                        var message = new Message(gui)
                        message.recipient = watchdog
                        message.command = "DEBUG"
                        message.args = module["fullname"]
                        message.set_data(this.checked)
                        gui.send(message)
                    };
                }(module, watchdog));
                // edit the module's configuration
                $("#"+this.id+"_edit_"+module_id).unbind().click(function(scope, name) {
                    return function () {
                        if (scope == "controller") window.location.hash = '#__configuration='+scope+'/'+name;
                        else window.location.hash = '#__module_wizard='+scope+'/'+name;
                    };
                }(module["scope"], module["name"]));
                // start the module
                $("#"+this.id+"_start_"+module_id).unbind().click(function(module, watchdog) {
                    return function () {
                        var message = new Message(gui)
                        message.recipient = watchdog
                        message.command = "START"
                        message.args = module["fullname"]
                        gui.send(message)
                    };
                }(module, watchdog));
                // stop the module
                $("#"+this.id+"_stop_"+module_id).unbind().click(function(module, watchdog) {
                    return function () {
                        var message = new Message(gui)
                        message.recipient = watchdog
                        message.command = "STOP"
                        message.args = module["fullname"]
                        gui.send(message)
                    };
                }(module, watchdog));
                // restart the module
                $("#"+this.id+"_restart_"+module_id).unbind().click(function(module, watchdog) {
                    return function () {
                        var message = new Message(gui)
                        message.recipient = watchdog
                        message.command = "RESTART"
                        message.args = module["fullname"]
                        gui.send(message)
                    };
                }(module, watchdog));
                // for a notification module, manually run it
                if (module["scope"] == "notification") {
                    $("#"+this.id+"_set_"+module_id).unbind().click(function(module_id, module, id) {
                        return function () {
                            var value = $("#"+id+"_set_text_"+module_id).val()
                            var message = new Message(gui)
                            message.recipient = module["fullname"]
                            message.command = "RUN"
                            message.args = "info"
                            message.set_data(value)
                            gui.send(message)
                            gui.notify("info", "Requesting "+module["fullname"]+" to notify about "+value)
                        };
                    }(module_id, module, this.id));
                }
                // set status
                this.set_status(module["fullname"], module["started"])
                // ping the module
                // TODO: ping not working with remote modules
                this.ping[module["fullname"]] = (new Date()).getTime()
                var message = new Message(gui)
                message.recipient = module["fullname"]
                message.command = "PING"
                this.send(message)
            }
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}