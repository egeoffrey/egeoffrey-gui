// modules widget
class Modules extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.ping = {}
        this.modules = []
        this.filter = null
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
        // discover available modules
        var message = new Message(gui)
        message.recipient = "*/*"
        message.command = "DISCOVER"
        message.args = "req"
        this.modules = []
        this.send(message)
        // subscribe for start/stop notifications
        this.add_inspection_listener("+/+", "*/*", "STATUS", "#")
        // subscribe for ping responses
        this.add_inspection_listener("+/+", "+/+", "PONG", "#")
        // subscribe for discover responses
        this.add_inspection_listener("+/+", "*/*", "DISCOVER", "res")
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _table, _selector
        var body = "#"+this.id+"_body"
        $(body).html("")
        // add selector
        var selector = '\
            <div class="form-group">\
                <select class="form-control" id="'+this.id+'_selector">\
                    <option value="controller">controller</option>\
                    <option value="service">service</option>\
                    <option value="interaction">interaction</option>\
                    <option value="notification">notification</option>\
                </select>\
            </div>\
        '
        $(body).append(selector)
        // configure selector action on change
        $("#"+this.id+"_selector").unbind().change(function(this_class) {
            return function () {
                var request = $("#"+this_class.id+"_selector").val()
                var table = $("#"+this_class.id+"_table").DataTable()
                table.clear().draw()
                this_class.filter = request
                this_class.request_data()
            };
        }(this));
        // add table
        // 0: module
        // 1: watchdog (hidden)
        // 2: version
        // 3: running
        // 4: configured
        // 5: ping
        // 6: debug
        // 7: actions
        var table = '\
            <table id="'+this.id+'_table" class="table table-bordered table-striped">\
                <thead>\
                    <tr><th>Name</th><th>Watchdog</th><th>Version</th><th>Running</th><th>Configured</th><th>Ping</th><th>Debug</th><th>Actions</th></tr>\
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
                    "targets": [2, 3, 4, 5, 6, 7]
                },
                {
                    "targets" : [1],
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
        if (this.filter == null) this.filter = "controller"
        this.request_data()
    }
    
    // receive data and load it into the widget
    on_message(message) {
        if (message.command == "STATUS") {
            this.set_status(message.sender, message.args)
            if (message.args == 1) gui.notify("success", message.sender+" has started")
            else gui.notify("success", message.sender+" has stopped")
        }
        else if (message.command == "PONG") {
            var latency = ((new Date()).getTime()-this.ping[message.sender])/1000
            $("#"+this.id+"_ping_"+message.sender.replace("/","_")).html(latency+"s")

        }
        else if (message.sender.startsWith("system/watchdog") && message.command == "DISCOVER" && message.args == "res") {
            // for each module managed by the watchdog
            var watchdog = message.sender
            for (var module of message.get_data()) {
                // prevent adding the same module twice
                if (this.modules.includes(module["fullname"])) continue
                if (this.filter != null && (! module["fullname"].startsWith(this.filter))) continue
                this.modules.push(module["fullname"])
                // TODO: refresh, table size, ping from UI, auto-refresh, gray start/stop
                // add a row to the table with the discovered module
                var table = $("#"+this.id+"_table").DataTable()
                var module_id = module["scope"]+'_'+module["name"]
                var version = manifest["version"]+"-"+manifest["revision"]+" ("+manifest["branch"]+") build "+module["build"]
                var running_icon = '<i id="'+this.id+'_running_'+module_id+'" class="" style="color: green;"></i>'
                var configured_icon = '<i id="'+this.id+'_configured_'+module_id+'" class="" style="color: green;"></i>'
                var debug_html = '<input id="'+this.id+'_debug_'+module_id+'" type="checkbox">'
                var set_html = this.filter == "notification" ? '<div class="input-group margin"><input type="text" id="'+this.id+'_set_text_'+module_id+'" class="form-control"><span class="input-group-btn"><button type="button" id="'+this.id+'_set_'+module_id+'" class="btn btn-default" ><span class="fas fa-sign-out-alt"></span></button></span></div><br>' : ""
                var edit_html = '<button type="button" id="'+this.id+'_edit_'+module_id+'" class="btn btn-default"><i class="fas fa-edit"></i></button>'
                var start_html = '<button type="button" id="'+this.id+'_start_'+module_id+'" class="btn btn-default" disabled><i class="fas fa-play"></i></button>'
                var stop_html = '<button type="button" id="'+this.id+'_stop_'+module_id+'" class="btn btn-default" disabled><i class="fas fa-stop"></i></button>'
                var restart_html = '<button type="button" id="'+this.id+'_restart_'+module_id+'" class="btn btn-default" disabled><i class="fas fa-sync"></i></button>'
                var table_options = [
                    module["fullname"], 
                    watchdog, 
                    version, 
                    running_icon, 
                    configured_icon, 
                    '<span id="'+this.id+'_ping_'+module_id+'"></span>', 
                    debug_html, 
                    set_html+edit_html+ " "+start_html+" "+stop_html+" "+restart_html 
                ]
                table.row.add(table_options).draw();
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
                        window.location.hash = '#__configuration='+scope+'/'+name;
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
                if (this.filter == "notification") {
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
                gui.send(message)
            }
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}