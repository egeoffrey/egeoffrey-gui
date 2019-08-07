// sensor wizard widget
class Sensor_wizard extends Widget {
    // TODO: when refreshing a new table is added
    // TODO: when searching all the buttons stop working
    constructor(id, widget) {
        super(id, widget)
        this.manifests = {}
    }
    
    // draw the widget's content
    draw() {
        // clear up the modal
        $("#wizard_body").html("")
        $("#wizard_title").html("Sensor Configuration")
        // show the modal
        $("#wizard").modal()
        // build the form
        $("#wizard_body").append('\
            <form method="POST" data-toggle="validator" role="form" id="'+this.id+'_form">\
                <div class="form-group">\
                    <label>Sensor identifier*</label>\
                    <input type="text" id="'+this.id+'_sensor_id" class="form-control" placeholder="identifier that will be used to reference the sensor" required>\
                </div>\
                <div class="form-group">\
                    <label>Sensor Description</label>\
                    <input type="text" id="'+this.id+'_description" class="form-control" placeholder="short description of the sensor">\
                </div>\
                <div class="form-group">\
                    <label>Sensor Icon</label>\
                    <input type="text" id="'+this.id+'_icon" class="form-control" placeholder="e.g. microchip">\
                </div>\
                <div class="panel panel-default">\
                    <div class="panel-heading">Data</div>\
                    <div class="panel-body">\
                        <div class="form-group">\
                            <label>Format*</label>\
                            <select id="'+this.id+'_format" class="form-control" required>\
                                <option value="int">Integer</option>\
                                <option value="float_1">Float w/ one decimal</option>\
                                <option value="float_2">Float w/ two decimals</option>\
                                <option value="string">String</option>\
                                <option value="calendar">Calendar</option>\
                                <option value="image">Image</option>\
                                <option value="position">Position</option>\
                                <option value="tasks">Tasks</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Unit</label>\
                            <input type="text" id="'+this.id+'_unit" class="form-control" placeholder="e.g. °C">\
                        </div>\
                    </div>\
                </div>\
                <div class="panel panel-default">\
                    <div class="panel-heading">Processing</div>\
                    <div class="panel-body">\
                        <div class="form-group">\
                            <label>Automatic Aggregation</label>\
                            <select id="'+this.id+'_calculate" class="form-control"><option value="">None</option></select>\
                        </div>\
                        <div class="form-group">\
                            <label>Retention Policies</label>\
                            <select id="'+this.id+'_retain" class="form-control"><option value="">None</option></select>\
                        </div>\
                        <div class="form-group">\
                            <label>Post Process Data After Acquisition</label>\
                            <select id="'+this.id+'_post_processor" class="form-control"><option value="">None</option></select>\
                        </div>\
                    </div>\
                </div>\
                <div class="panel panel-primary">\
                    <div class="panel-heading">\
                        <div class="form-group">\
                            <label>Associated Service</label>\
                            <select id="'+this.id+'_service_name" class="form-control"><option value="">None</option></select>\
                        </div>\
                    </div>\
                    <div class="panel-body hidden" id="'+this.id+'_service_panel">\
                        <div class="form-group">\
                            <label>How to interact with the service*</label>\
                            <select id="'+this.id+'_service_mode" class="form-control">\
                            </select>\
                        </div>\
                        <div class="panel panel-default hidden" id="'+this.id+'_service_schedule_panel">\
                            <div class="panel-heading">Scheduler</div>\
                            <div class="panel-body">\
                                <div class="form-group">\
                                    <label>Polling Mode*</label>\
                                    <select id="'+this.id+'_service_schedule_trigger" class="form-control">\
                                        <option value="interval">Interval - run the job at fixed intervals of time</option>\
                                        <option value="cron">Cron - run the job periodically at certain time(s) of day</option>\
                                    </select>\
                                </div>\
                                <div id="'+this.id+'_service_schedule_panel_interval" class="d-none">\
                                    <div class="form-group">\
                                        <label>days</label>\
                                        <input type="text" id="'+this.id+'_service_schedule_days" class="form-control" placeholder="e.g. 3 to poll every 3 days">\
                                    </div>\
                                    <div class="form-group">\
                                        <label>hours</label>\
                                        <input type="text" id="'+this.id+'_service_schedule_hours" class="form-control" placeholder="e.g. 3 to poll every 3 hours">\
                                    </div>\
                                    <div class="form-group">\
                                        <label>minutes</label>\
                                        <input type="text" id="'+this.id+'_service_schedule_minutes" class="form-control" placeholder="e.g. 3 to poll every 3 minutes">\
                                    </div>\
                                    <div class="form-group">\
                                        <label>seconds</label>\
                                        <input type="text" id="'+this.id+'_service_schedule_seconds" class="form-control" placeholder="e.g. 3 to poll every 3 seconds">\
                                    </div>\
                                </div>\
                                <div id="'+this.id+'_service_schedule_panel_cron" class="d-none">\
                                    <div class="form-group">\
                                        <label>day</label>\
                                        <input type="text" id="'+this.id+'_service_schedule_day" class="form-control" placeholder="e.g. 3 to poll at the 3rd of each month. Use \'*\' for every day">\
                                    </div>\
                                    <div class="form-group">\
                                        <label>hour</label>\
                                        <input type="text" id="'+this.id+'_service_schedule_hour" class="form-control" placeholder="e.g. 3 to poll at 3am every day. Use \'*\' for every hour">\
                                    </div>\
                                    <div class="form-group">\
                                        <label>minute</label>\
                                        <input type="text" id="'+this.id+'_service_schedule_minute" class="form-control" placeholder="e.g. 3 to poll at the 3rd minute of every hour. Use \'*\' for every minute">\
                                    </div>\
                                    <div class="form-group">\
                                        <label>second</label>\
                                        <input type="text" id="'+this.id+'_service_schedule_second" class="form-control" placeholder="e.g. 3 to poll at the 3rd second of every minute">\
                                    </div>\
                                </div>\
                            </div>\
                        </div>\
                        <div class="panel panel-default">\
                            <div class="panel-heading">Configuration</div>\
                            <div class="panel-body" id="'+this.id+'_service_configuration">\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>\
            ')
        // configure service name selector
        $('#'+this.id+'_service_name').unbind().change(function(this_class) {
            return function () {
                var service = $('#'+this_class.id+'_service_name').val()
                // show the service panel only if a service is selected
                if (service == "") {
                    $('#'+this_class.id+'_service_panel').addClass("d-none")
                    return
                } else $('#'+this_class.id+'_service_panel').removeClass("d-none")
                // get the manifest associated to the selected service
                var manifest = this_class.manifests["service/"+service]
                if (manifest == null) {
                    gui.notify("error","The associated service is not available, cannot display the sensor's options")
                    $("#wizard").modal("hide")
                    return
                }
                // populate service mode only with allowed modes
                if ($('#'+this_class.id+'_service_mode').size() == 1) {
                    for (var module_object of manifest["modules"]) {
                        for (var module in module_object) {
                            for (var mode in module_object[module]["service_configuration"]) {
                                var text = ""
                                if (mode == "active") text = "Active - periodically poll the sensor for new data"
                                else if (mode == "passive") text = "Passive - the sensor will periodically provide new data"
                                else if (mode == "actuator") text = "Actuator - the sensor is an actuator"
                                // add it to the select
                                $('#'+this_class.id+'_service_mode').append($('<option>', {
                                    value: mode,
                                    text: text
                                }));
                                // select the first item
                                $('#'+this_class.id+'_service_mode').prop("selectedIndex", 0).trigger("change")
                                // if active is selected, trigger the change event on the schedule trigger
                                if ($('#'+this_class.id+'_service_mode').val() == "active") {
                                    $('#'+this_class.id+'_service_schedule_trigger').prop("selectedIndex", 0).trigger("change")
                                }
                            }
                         }
                    }
                }
            };
        }(this))
        // configure service mode selector
        $('#'+this.id+'_service_mode').unbind().change(function(this_class) {
            return function () {
                var selected_service = $('#'+this_class.id+'_service_name').val()
                var selected_mode = $('#'+this_class.id+'_service_mode').val()
                // show/hide the schedule panel
                if (selected_mode == "active") $('#'+this_class.id+'_service_schedule_panel').removeClass("d-none")
                else $('#'+this_class.id+'_service_schedule_panel').addClass("d-none")
                // clear service configuration
                $('#'+this_class.id+'_service_configuration').html("")
                // get the manifest associated to the selected service
                var manifest = this_class.manifests["service/"+selected_service]
                if (manifest == null) return
                // build the service configuration form based on the selected mode
                for (var module_object of manifest["modules"]) {
                    for (var module in module_object) {
                        for (var mode in module_object[module]["service_configuration"]) {
                            if (mode != selected_mode) continue
                            // retrieve the service configuration schema
                            var configurations = module_object[module]["service_configuration"][mode]
                            // for each configuration add an input box
                            for (var configuration of configurations) {
                                var input = ""
                                var required = "required" in configuration && configuration["required"] ? "required" : ""
                                var required_flag = required != "" ? "*" : ""
                                var options_html = ""
                                if (required == "") options_html = options_html+'<option value=""></option>'
                                // draw a select input
                                if (configuration["format"] != "int" && configuration["format"] != "float" && configuration["format"] != "string") {
                                    var options = configuration["format"].split("|")
                                    for (var option of options) options_html = options_html+'<option value="'+option+'">'+option+'</option>'
                                    input = '\
                                        <div class="form-group">\
                                            <label>'+configuration["description"]+required_flag+'</label>\
                                            <select id="'+this_class.id+'_service_configuration_'+configuration["name"]+'" name="'+configuration["name"]+'" class="form-control" '+required+'>'+options_html+'</select>\
                                        </div>'
                                } 
                                // draw a text input
                                else {
                                    var placeholder = "placeholder" in configuration ? "e.g. "+configuration["placeholder"] : ""
                                    input = '\
                                        <div class="form-group">\
                                            <label>'+configuration["description"]+required_flag+'</label>\
                                            <input type="text" id="'+this_class.id+'_service_configuration_'+configuration["name"]+'" name="'+configuration["name"]+'" class="form-control" placeholder="'+placeholder+'" '+required+'>\
                                        </div>'
                                }
                                $('#'+this_class.id+'_service_configuration').append(input)
                            }
                        }
                    }
                }
            };
        }(this))
        // configure service schedule trigger selector
        $('#'+this.id+'_service_schedule_trigger').unbind().change(function(this_class) {
            return function () {
                var value = $('#'+this_class.id+'_service_schedule_trigger').val()
                if (value == "cron") {
                    $('#'+this_class.id+'_service_schedule_panel_interval').addClass("d-none")
                    $('#'+this_class.id+'_service_schedule_panel_cron').removeClass("d-none")
                }
                else if (value == "interval") {
                    $('#'+this_class.id+'_service_schedule_panel_cron').addClass("d-none")
                    $('#'+this_class.id+'_service_schedule_panel_interval').removeClass("d-none")
                }

            };
        }(this))
        // what to do when the form is submitted
        var id = this.id
        var this_class = this
        $('#'+this.id+'_form').validator().on('submit', function (e) {
            // form is validated
            if (! e.isDefaultPrevented()) {
                // get sensor_id 
                var sensor_id = $("#"+this_class.id+"_sensor_id").val()
                // build up the configuration file
                var sensor = {}
                for (var item of ["description", "icon", "format", "unit", "calculate", "retain", "post_process"]) {
                    var value = $("#"+this_class.id+"_"+item).val()
                    if (value == null || value == "") continue
                    sensor[item] = $.isNumeric(value) ? parseFloat(value) : value
                }
                var service_name = $("#"+this_class.id+"_service_name").val()
                if (service_name != null && service_name != "") {
                    sensor["service"] = {}
                    sensor["service"]["name"] = $("#"+this_class.id+"_service_name").val()
                    sensor["service"]["mode"] = $("#"+this_class.id+"_service_mode").val()
                    if (sensor["service"]["mode"] == "active") {
                        var schedule_trigger = $("#"+this_class.id+"_service_schedule_trigger").val()
                        var schedule_panel = this_class.id+"_service_schedule_panel_"+schedule_trigger
                        sensor["service"]["schedule"] = {}
                        sensor["service"]["schedule"]["trigger"] = schedule_trigger
                        $("#"+schedule_panel+" :input").each(function(e){
                            var item = this.id.replace(this_class.id+"_service_schedule_", "")
                            var value = this.value
                            if (value != null && value != "") sensor["service"]["schedule"][item] = $.isNumeric(value) ? parseFloat(value) : value
                        });
                    }
                    sensor["service"]["configuration"] = {}
                    $("#"+this_class.id+"_service_configuration :input").each(function(e){
                        var item = this.id.replace(this_class.id+"_service_configuration_", "")
                        var value = this.value
                        if (value != null && value != "") sensor["service"]["configuration"][item] = $.isNumeric(value) ? parseFloat(value) : value
                    });
                }
                // save new/updated configuration
                var message = new Message(gui)
                message.recipient = "controller/config"
                message.command = "SAVE"
                message.args = "sensors/"+sensor_id
                message.config_schema = gui.supported_sensors_config_schema
                message.set_data(sensor)
                gui.send(message)
                // close the modal
                $("#wizard").modal("hide")
                gui.notify("success","Sensor "+sensor_id+" saved successfully")
                return false
            }
        })
        // configure submit button
        $('#wizard_save').unbind().click(function(this_class) {
            return function () {
                $("#"+this_class.id+"_form").validator("update")
                $("#"+this_class.id+"_form").submit()
            };
        }(this))
        // what to do when the modal is closed
        $('#wizard').one('hidden.bs.modal', function () {
            gui.unload_page()
            window.history.back()
        })
        // ask for controller/hub configuration
        this.add_configuration_listener("controller/hub", 1)
        // request manifests for all the services
        this.add_broadcast_listener("+/+", "MANIFEST", "#")
        // extract requested sensor from URL
        if (location.hash.includes("=")) {
            setTimeout(function(this_class) {
                return function() {
                    var request = location.hash.split("=")
                    this_class.add_configuration_listener("sensors/"+ request[1], gui.supported_sensors_config_schema)
                };
            }(this), 100);
        }
    }
    
    // receive data and load it into the widget
    on_message(message) {
        // receive manifest from services
        if (message.command == "MANIFEST") {
            var manifest = message.get_data()
            if (manifest["manifest_schema"] != gui.supported_manifest_schema) return
            // for each module of the package
            for (var module_object of manifest["modules"]) {
                for (var module in module_object) {
                    if (! module.startsWith("service/")) continue
                    if (! gui.is_valid_configuration(["service_configuration", "service_configuration"], module_object[module])) continue
                    // add it to the select
                    var description = "description" in module_object[module] ? module_object[module]["description"] : manifest["description"]
                    $('#'+this.id+'_service_name').append($('<option>', {
                        value: module.replace("service/",""),
                        text: module.replace("service/","")+": "+description
                    }));
                    // keep track of the manifest
                    this.manifests[module] = manifest
                }
            }
        }
    }
    
    // receive configuration
    on_configuration(message) {
        // receive hub configuration
        if (message.args == "controller/hub") {
            var data = message.get_data()
            // populate the selector with options
            for (var item of ["retain", "calculate", "post_processor"]) {
                if ($('#'+this.id+'_'+item+' option').size() == 1) {
                    for (var value in data[item]) {
                        // add it to the select
                        $('#'+this.id+'_'+item).append($('<option>', {
                            value: value,
                            text: data[item][value]["description"]
                        }));
                    }
                }
            }
       } 
        // assuming we are receiving a sensor configuration (edit)
        else {
            // set sensor_id
            var sensor_id = message.args.replace("sensors/","")
            var sensor = message.get_data()
            $("#"+this.id+"_sensor_id").val(sensor_id)
            $("#"+this.id+"_sensor_id").prop("disabled", true)
            // populate the rest of the form
            for (var item of ["description", "icon", "format", "unit", "calculate", "retain", "post_process"]) {
                if (item in sensor) $("#"+this.id+"_"+item).val(sensor[item])
            }
            if ("service" in sensor) {
                $("#"+this.id+"_service_name").val(sensor["service"]["name"]).trigger('change')
                $("#"+this.id+"_service_mode").val(sensor["service"]["mode"]).trigger('change')
                if ("schedule" in sensor["service"]) {
                    for (var item in sensor["service"]["schedule"]) $("#"+this.id+"_service_schedule_"+item).val(sensor["service"]["schedule"][item])
                }
                if ("configuration" in sensor["service"]) {
                    for (var item in sensor["service"]["configuration"]) $("#"+this.id+"_service_configuration_"+item).val(sensor["service"]["configuration"][item])
                }
            }
        }

    }
}