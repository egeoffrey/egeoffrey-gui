// sensors widget
class Sensors extends Widget {
    // TODO: when refreshing a new table is added
    // TODO: when searching all the buttons stop working
    constructor(id, widget) {
        super(id, widget)
        this.sensors = {}
        this.listener = null
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // request the data to the database
    request_data(sensor_id) {
        // ask for the latest value
        var message = new Message(gui)
        message.recipient = "controller/db"
        message.command = "GET"
        message.args = sensor_id
        gui.sessions.register(message, {
            "component": "value",
            "sensor_id": sensor_id,
        })
        this.send(message)
        // ask for the timestamp
        var message = new Message(gui)
        message.recipient = "controller/db"
        message.command = "GET_TIMESTAMP"
        message.args = sensor_id
        gui.sessions.register(message, {
            "component": "timestamp",
            "sensor_id": sensor_id
        })
        this.send(message)
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _table
        // if refresh requested, we need to unsubscribe from the topics to receive them again
        if (this.listener != null) {
            this.remove_listener(this.listener)
            this.sensors = {}
        }
        var body = "#"+this.id+"_body"
        $(body).html("")
        // add new sensor button
        var button_html = '\
            <div class="form-group">\
                <button type="button" id="'+this.id+'_new" class="btn btn-block btn-primary btn-lg"><i class="fas fa-plus"></i> Register a new sensor</button>\
            </div>'
        $(body).append(button_html)
        $("#"+this.id+"_new").unbind().click(function(this_class) {
            return function () {
                window.location.hash = '#__sensor_wizard'
            };
        }(this));
        // add table
        // 0: sensor_id (hidden)
        // 1: Icon
        // 2: sensor
        // 3: format (hidden)
        // 4: unit (hidden)
        // 5: calculate (hidden)
        // 6: retain (hidden)
        // 7: service
        // 8: last value
        // 9: timestamp
        // 10: actions
        // 11: disabled
        var table = '\
            <table id="'+this.id+'_table" class="table table-bordered table-striped">\
                <thead>\
                    <tr><th>_sensor_id_</th><th>Icon</th><th>Sensor</th><th>_format_</th><th>_unit_</th><th>_calculate_</th><th>_retain_</th><th>Associated Service</th><th>Value</th><th>Elapsed</th><th>Actions</th><th>_disabled_</th></tr>\
                </thead>\
                <tbody></tbody>\
            </table>'
        $(body).append(table)
        // how to render the timestamp
        function render_timestamp(data, type, row, meta) {
            if (type == "display") return gui.date.timestamp_difference(gui.date.now(), data)
            else return data
        };
        // how to render the icon
        function render_icon(data, type, row, meta) {
            if (type == "display") return '<i class="fas fa-2x fa-'+data+'"></i>'
            else return data
        };

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
                    "targets" : 9,
                    "render": render_timestamp,
                },
                {
                    "targets" : 1,
                    "render": render_icon,
                },
                {
                    "targets" : [0, 3, 4, 5, 6, 11],
                    "visible": false,
                },
                {
                    "className": "dt-center", 
                    "targets": [1, 8, 9, 10]
                }
            ],
            "language": {
                "emptyTable": '<span id="'+this.id+'_table_text"></span>'
            }
        };
        // create the table
        if (! $.fn.dataTable.isDataTable("#"+this.id+"_table")) {
            $("#"+this.id+"_table").DataTable(options)
        } else {
            var table = $("#"+this.id+"_table").DataTable()
            table.clear()
        }
        $("#"+this.id+"_table_text").html('<i class="fas fa-spinner fa-spin"></i> Loading')
        // discover registered sensors
        this.listener = this.add_configuration_listener("sensors/#", gui.supported_sensors_config_schema)
        // subscribe for acknoledgments from the database for saved values
        this.add_inspection_listener("controller/db", "*/*", "SAVED", "#")
    }
    
    // receive data and load it into the widget
    on_message(message) {
        // database just saved a value check if our sensor is involved and if so refresh the data
        if (message.sender == "controller/db" && message.command == "SAVED") {
            if (message.has("group_by")) return
            var sensor_id = message.args
            if (sensor_id in this.sensors) this.request_data(sensor_id)
        }
        else if (message.command.startsWith("GET")) {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            var sensor_id = session["sensor_id"]
            var sensor = gui.configurations["sensors/"+sensor_id].get_data()
            var table = $("#"+this.id+"_table").DataTable()
            // add value
            var this_class = this
            if (session["component"] == "value") {
                table.rows().every( function ( row_index, table_loop, row_loop ) {
                    var row = this.data()
                    if (row[0] != sensor_id) return
                    else if (row[3] == "calendar") data = '<i class="fas fa-calendar-alt fa-2x"></i>'
                    else if (row[3] == "tasks") data = '<i class="fas fa-tasks fa-2x"></i>'
                    else if (row[3] == "image" && data != "") data = '<img class="img-responsive" width="200" height="100" src="data:image/jpeg;base64,'+data+'"/>'
                    else {
                        var unit = data != "" ? row[4] : ""
                        data = data+unit
                        data = format_multiline(truncate(data.replaceAll("\n", "<br>"), 100), 15)
                        data = this_class.disabled_item(data, row[11])
                    }
                    table.cell(row_index, 8).data(data).draw(false)
                });
            }
            // add timestamp
            if (session["component"] == "timestamp") {
                table.rows().every( function ( row_index, table_loop, row_loop ) {
                    if (data.length != 1) return
                    var row = this.data()
                    if (row[0] != sensor_id) return
                    table.cell(row_index, 9).data(data[0]).draw(false)
                });
            }
        }
    }
    
    // format an object for displaying
    format_object(object) {
        return "- "+JSON.stringify(object).replaceAll("{","").replaceAll("}","").replaceAll("\"","").replaceAll(":",": ").replaceAll(",","<br>- ")
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
    
    // receive configuration
    on_configuration(message) {
        var sensor_id = message.args.replace("sensors/","")
        // skip sensors already received
        // TODO: handle / in sensor_id for html
        if (sensor_id in this.sensors) return
        var sensor = message.get_data()
        this.sensors[sensor_id] = sensor
        var sensor_tag = sensor_id.replaceAll("/","_")
        // add a line to the table
        var table = $("#"+this.id+"_table").DataTable()
        var disabled = "disabled" in sensor && sensor["disabled"]
        var icon = "icon" in sensor ? sensor["icon"] : "microchip"
        var description = "description" in sensor ? "<b>"+sensor["description"]+"</b><br>("+sensor_id+")" : "<b>"+sensor_id+"</b>"
        var unit = "unit" in sensor ? sensor["unit"] : ""
        var calculate = "calculate" in sensor ? sensor["calculate"] : ""
        var retain = "retain" in sensor ? sensor["retain"] : ""
        var service = ""
        if ("service" in sensor) {
            var service_name = "<u>"+sensor["service"]["name"]+"</u>"
            var service_mode = '<span class="d-none">'+"mode: "+sensor["service"]["mode"]+"</span>"
            var service_configuration = "configuration:<br>&nbsp;&nbsp;"+this.format_object(sensor["service"]["configuration"]).replaceAll("<br>", "<br>&nbsp;&nbsp;")
            var service_icon = ""
            service = "<u>"+sensor["service"]["name"]+"</u><br>mode: "+sensor["service"]["mode"]+"<br>configuration:<br>&nbsp;&nbsp;"+this.format_object(sensor["service"]["configuration"]).replaceAll("<br>", "<br>&nbsp;&nbsp;")
            if (sensor["service"]["mode"] == "actuator") service_icon = '<i class="fas fa-cogs fa-2x"></i>'
            else if (sensor["service"]["mode"] == "passive") service_icon = '<i class="fas fa-satellite-dish fa-2x"></i>'
            else if (sensor["service"]["mode"] == "active") {
                var service_icon = '<button type="button" id="'+this.id+'_poll_'+sensor_tag+'" class="btn btn-default"><i class="fas fa-play"></i></button>'
            }
            var service_schedule = ""
            if ("schedule" in sensor["service"]) {
                service_schedule = "schedule:<br>&nbsp;&nbsp;"+this.format_object(sensor["service"]["schedule"]).replaceAll("<br>", "<br>&nbsp;&nbsp;")
            }
            service = service_icon+"&nbsp;&nbsp;"+service_name+service_mode+"<br>"+service_configuration+"<br>"+service_schedule
        }
        var set_html = '<div class="input-group margin"><input type="text" id="'+this.id+'_set_text_'+sensor_tag+'" class="form-control"><span class="input-group-btn"><button type="button" id="'+this.id+'_set_'+sensor_tag+'" class="btn btn-default" ><span class="fas fa-sign-out-alt"></span></button></span></div>'
        var graph_html = '<button type="button" id="'+this.id+'_graph_'+sensor_tag+'" class="btn btn-default" ><i class="fas fa-chart-bar"></i></button>'
        var edit_html = '<button type="button" id="'+this.id+'_edit_'+sensor_tag+'" class="btn btn-default"><i class="fas fa-edit"></i></button>'
        var empty_html = '<button type="button" id="'+this.id+'_empty_'+sensor_tag+'" class="btn btn-default"><i class="fas fa-eraser"></i></button>'
        var delete_html = '<button type="button" id="'+this.id+'_delete_'+sensor_tag+'" class="btn btn-default"><i class="fas fa-trash"></i></button>'
        // add the row
        var row = [
            sensor_id, 
            icon, 
            this.disabled_item(description, disabled), 
            sensor["format"], 
            unit, 
            calculate, 
            retain, 
            this.disabled_item(service, disabled), 
            "", 
            "", 
            set_html+"<br>"+graph_html+" "+edit_html+" "+empty_html+" "+delete_html,
            disabled
        ]
        table.row.add(row).draw(false);
        if (table.data().count() == 0) $("#"+this.id+"_table_text").html('No data to display')
        // request value and timestamp
        this.request_data(sensor_id)
        // enable graph and set button
        if (sensor["format"] != "float_1" && sensor["format"] != "float_2" && sensor["format"] != "string" && sensor["format"] != "int") {
            $("#"+this.id+"_graph_"+sensor_tag).addClass("d-none");
            $("#"+this.id+"_set_"+sensor_tag).addClass("d-none");
            $("#"+this.id+"_set_text_"+sensor_tag).addClass("d-none");
        }
        // poll the service associated to the sensor
        $("#"+this.id+"_poll_"+sensor_tag).unbind().click(function(sensor_id) {
            return function () {
                var message = new Message(gui)
                message.recipient = "controller/hub"
                message.command = "POLL"
                message.args = sensor_id
                gui.send(message)
                gui.notify("info", "Requesting to poll the service associated to "+sensor_id)
            };
        }(sensor_id));
        // manually set the value to a sensor
        $("#"+this.id+"_set_"+sensor_tag).unbind().click(function(id, sensor_id) {
            return function () {
                var sensor_tag = sensor_id.replaceAll("/","_")
                var value = $("#"+id+"_set_text_"+sensor_tag).val()
                var message = new Message(gui)
                message.recipient = "controller/hub"
                message.command = "SET"
                message.args = sensor_id
                message.set("value", value)
                gui.send(message)
                gui.notify("info", "Requesting to set "+sensor_id+" to value "+value)
            };
        }(this.id, sensor_id));
        // show graphs for the selected sensor
        $("#"+this.id+"_graph_"+sensor_tag).unbind().click(function(sensor_id) {
            return function () {
                window.location.hash = '#__sensor='+sensor_id;
            };
        }(sensor_id));
        // edit the selected sensor
        $("#"+this.id+"_edit_"+sensor_tag).unbind().click(function(sensor_id) {
            return function () {
                window.location.hash = '#__sensor_wizard='+sensor_id;
            };
        }(sensor_id));
        // empty the database entries for this sensor
        $("#"+this.id+"_empty_"+sensor_tag).unbind().click(function(sensor_id) {
            return function () {
                gui.confirm("Do you really want to delete all database entries of sensor "+sensor_id+"?", function(result){ 
                    if (! result) return
                    var message = new Message(gui)
                    message.recipient = "controller/db"
                    message.command = "DELETE_SENSOR"
                    message.args = sensor_id
                    gui.send(message)
                    gui.notify("info", "Requesting to database to delete all the entries associated to sensor "+sensor_id)
                });
            };
        }(sensor_id));
        // delete the sensor and empty the database 
        $("#"+this.id+"_delete_"+sensor_tag).unbind().click(function(sensor_id, version) {
            return function () {
                gui.confirm("Do you really want to delete sensor "+sensor_id+" and all its associated data?", function(result){ 
                    if (! result) return
                    // delete the sensor from the database
                    var message = new Message(gui)
                    message.recipient = "controller/db"
                    message.command = "DELETE_SENSOR"
                    message.args = sensor_id
                    gui.send(message)
                    // delete the sensor configuration file
                    var message = new Message(gui)
                    message.recipient = "controller/config"
                    message.command = "DELETE"
                    message.args = "sensors/"+sensor_id
                    message.config_schema = version
                    gui.send(message)
                    gui.notify("info", "Requesting to delete the sensor "+sensor_id)
                });
            };
        }(sensor_id, message.config_schema));
        // disable buttons if sensor is disabled
        if (disabled) {
            $("#"+this.id+"_poll_"+sensor_tag).prop('disabled', true);
            $("#"+this.id+"_set_"+sensor_tag).prop('disabled', true);
            $("#"+this.id+"_set_text_"+sensor_tag).prop('disabled', true);
        }
    }
}