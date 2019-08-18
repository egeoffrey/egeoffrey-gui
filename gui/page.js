// handle the page
class Page {
    constructor(type, page_id, page) {
        // keep track of page content and type
        this.page_id = page_id
        this.page = page
        this.type = type
        // array of created widgets objects
        this.widget_objects = []
        // map each widget_id to the widget configuration
        this.widgets = {}
        // if it is a user page, draw the page layout provided by the user
        if (type == "USER") this.draw(page)
        // if it is a system page, build the page layout and draw it
        else if (type == "SYSTEM") {
            if (page_id == "__sensor") {
                if (! location.hash.includes("=")) return
                var request = location.hash.split("=")
                var sensor_id = request[1]
                var page_layout = [
                    {
                        "sensor_id": [
                            {
                                "title": "Summary",
                                "size": 3,
                                "widget": "summary",
                                "icon": "microchip",
                                "sensors": [ 
                                  sensor_id
                                ]
                            },
                            {
                                "title": "Timeline",
                                "size": 9,
                                "widget": "timeline",
                                "sensors": [
                                  sensor_id
                                ]
                            }
                        ]
                    },
                    {
                        "": [
                            {
                                "title": "Hourly Timeline",
                                "size": 12,
                                "widget": "timeline",
                                "group_by": "hour",
                                "sensors": [ 
                                  sensor_id
                                ]
                            }
                        ]
                    },
                    {
                        "": [
                            {
                                "title": "Daily Timeline",
                                "size": 12,
                                "widget": "timeline",
                                "group_by": "day",
                                "sensors": [
                                  sensor_id
                                ]
                            }
                        ]
                    }
                ]
                // replace the sensor_id placeholder with the actual sensor_id
                Object.defineProperty(page_layout[0], sensor_id, Object.getOwnPropertyDescriptor(page_layout[0], "sensor_id"));
                delete page_layout[0]["sensor_id"];
                this.draw(page_layout)
            }
            else if (page_id == "__sensor_wizard") {
                var widget_object = new Sensor_wizard("sensor_wizard", {})
                widget_object.draw()
            }
            else if (page_id == "__rule_wizard") {
                var widget_object = new Rule_wizard("rule_wizard", {})
                widget_object.draw()
            }
            else if (page_id == "__notifications") {
                var page_layout = [
                    {
                        "": [
                            {
                                "title": "Notifications",
                                "size": 12,
                                "widget": "notifications"
                            }
                        ]
                    }
                ]
                this.draw(page_layout)
            }
            else if (page_id == "__configuration") {
                var page_layout = [
                    {
                        "": [
                            {
                                "title": "Configuration Editor",
                                "size": 12,
                                "widget": "configuration"
                            }
                        ]
                    }
                ]
                this.draw(page_layout)
            }
        }
    }
    
    // what to do when the user finish sorting the widgets on the page
    on_sort() {
        return
        var this_class = this
        // build the new layout
        var layout = []
        // for each row of the page
        $("#page > div").each(function(e){
            var row_tag = this.id
            // for each column
            var row = parseInt(row_tag.replace("row_", ""))
            layout[row] = []
            $("#page > #"+row_tag+" > section").each(function(e){
                var split = this.id.replace("widget_", "").split("_")
                var widget_row = parseInt(split[0])
                var widget_column = parseInt(split[1])
                // build the array of widget up the updated row
                layout[row].push(this_class.layout[widget_row][widget_column])
            });
        });
        // rebuild the page structure with the new layout
        for (var row = 0; row < this.page.length; row++) {
            for (var section in this.page[row]) {
                this.page[row][section] = layout[row]
            }
        }
        this.layout = layout
    }
    
    // add a new row to the page
    add_row(row, title) {
        // add section title
        $("#page").append('\
            <h2 class="page-header" id="title_row_'+row+'">\
                <center>\
                    <span id="title_text_row_'+row+'" class="no_edit_page_item">'+title+'</span> \
                    <input id="title_input_row_'+row+'" type="text" value="'+title+'" class="edit_page_item d-none">\
                    <button class="btn btn-default d-none btn-sm edit_page_item" id="delete_row_'+row+'"><i class="fas fa-trash-alt"></i> Delete Row</button>\
                    <button class="btn btn-default btn-sm edit_page_item d-none" id="add_widget_row_'+row+'"><i class="fas fa-ellipsis-h"></i> Add Widget</button>\
                </center>\
            </h2>\
        ')
        // add row
        $("#page").append('<div class="row connectedSortable" id="row_'+row+'"></div>')
        // keep in sync section text and input
        $("#title_input_row_"+row).unbind().keyup(function(this_class, row) {
            return function (e) {
                var value = $("#title_input_row_"+row).val()
                $("#title_text_row_"+row).html(value)
            };
        }(this, row));
        // configure delete row button
        $("#delete_row_"+row).unbind().click(function(this_class, row) {
            return function () {
                // remove both the title and the entire row
                $("#title_row_"+row).remove()
                $("#row_"+row).remove()
            };
        }(this, row));
        // make the widgets in the row sortable
        var this_class = this
        $("#row_"+row).sortable({
            placeholder: 'sort-highlight',
            connectWith: '.connectedSortable',
            handle: '.sortable',
            tolerance: 'pointer',
            distance: 0.5,
            forcePlaceholderSize: false,
            cancel: '',
            dropOnEmpty: true,
            zIndex: 999999,
            stop: function( event, ui ) { 
                this_class.on_sort()
            }
        })
    }
    
    // draw the page
    draw(page) {
        // clear up the page
        $("#body").empty()
        $("#body").append('<div id="page"></div>');
        // draw the page
        for (var row = 0; row < page.length; row++) {
            var row_id = 'row_'+row
            // add a row
            for (var section in page[row]) {
                // add a row/subtitle
                this.add_row(row, section)
                // add columns
                for (var column = 0; column < page[row][section].length; column++) {
                    var widget = page[row][section][column]
                    if (! gui.is_authorized(widget)) continue
                    var offset = 0;
                    if ("offset" in widget) offset = widget["offset"]
                    // add the column
                    var id = "widget_"+row+"_"+column
                    $("#"+row_id).append('<section class="col-lg-'+widget["size"]+' col-md-offset-'+offset+'" id="'+id+'"></section>')
                    this.widgets[id] = widget
                    // TODO: add loading overlay
                    // add the requested widget type
                    var widget_object = this.add_widget(id, widget)
                    // create the widget
                    if (widget_object != null) {
                        // load the data
                        widget_object.draw()
                        // configure the refresh button
                        $("#"+id+"_refresh").unbind().click(function(widget_object) {
                            return function () {
                                widget_object.draw()
                            };
                        }(widget_object));
                        // configure the expand button
                        $("#"+id+"_popup").unbind().click(function(this_class, widget) {
                            return function () {
                                // clear the modal and load it
                                $("#popup_body").html("")
                                $("#popup_title").html(title)
                                var widget_object = this_class.add_widget("popup_body", widget)
                                if (widget_object != null) widget_object.draw()
                                $("#popup").modal()
                            };
                        }(this, widget));
                        // configure the delete button
                        $("#"+id+"_delete").unbind().click(function(this_class, id) {
                            return function () {
                                // remove the widget
                                $("#"+id).remove()
                            };
                        }(this, id));
                    }
                }
            }
        }
        $('.connectedSortable .sortable').css('cursor', 'move')
        // configure page edit button
        $("#page_edit").unbind().click(function(this_class) {
            return function () {
                $(".edit_page_item").removeClass("d-none")
                $(".no_edit_page_item").addClass("d-none")
                $("#page_edit").addClass("d-none")
                $("#page_edit_done").removeClass("d-none")
            };
        }(this));
        // configure page edit cancel button
        $("#page_edit_cancel").unbind().click(function(this_class) {
            return function () {
                // restore the page layout
                $(".edit_page_item").addClass("d-none")
                $(".no_edit_page_item").removeClass("d-none")
                $("#page_edit").removeClass("d-none")
                $("#page_edit_done").addClass("d-none")
                gui.load_page()
            };
        }(this));
        // configure page edit done button
        $("#page_edit_done").unbind().click(function(this_class) {
            return function () {
                // rebuild the page data structure
                var page = []
                // for each row of the page
                $("#page > div").each(function(e){
                    var row_id = this.id
                    var row_num = parseInt(row_id.replace("row_", ""))
                    var columns = []
                    // for each column
                    $("#page > #"+row_id+" > section").each(function(e){
                        // build up the new row with previously stored widgets' configuration
                        columns.push(this_class.widgets[this.id])
                    });
                    var row = {}
                    row[$('#title_text_row_'+row_num).html()] = columns
                    // add the column to the 
                    page.push(row)
                })
                // save the updated page
                var message = new Message(gui)
                message.recipient = "controller/config"
                message.command = "SAVE"
                message.args = this_class.page_id
                message.config_schema = gui.page_config_schema
                message.set_data(page)
                gui.send(message)
                // restore the page layout
                $(".edit_page_item").addClass("d-none")
                $(".no_edit_page_item").removeClass("d-none")
                $("#page_edit").removeClass("d-none")
                $("#page_edit_done").addClass("d-none")
                gui.notify("success", "Page "+this_class.page_id+" updated succesfully")
                gui.load_page()
            };
        }(this));
        // configure add row button
        $("#page_add_row").unbind().click(function(this_class) {
            return function () {
                var row = this_class.page.length
                this_class.add_row(row, "")
                $("#title_row_"+row+" .edit_page_item").removeClass("d-none")
                $("#title_row_"+row+" .no_edit_page_item").addClass("d-none")
                window.scrollTo(0, document.body.scrollHeight);
            };
        }(this));
    }
    
    // close the current page
    close() {
        // close all the widget of the page
        for (var widget_object of this.widget_objects) {
            if(typeof widget_object.close === 'function')
            widget_object.close()
        }
    }
    
    // add the requested widget at the given html id
    add_widget(id, widget) {
        var widget_object = null
        // user widgets
        if (widget["widget"] == "summary") widget_object = new Summary(id, widget)
        else if (widget["widget"] == "timeline") widget_object = new Timeline(id, widget)
        else if (widget["widget"] == "range") widget_object = new Range(id, widget)
        else if (widget["widget"] == "value") widget_object = new Value(id, widget)
        else if (widget["widget"] == "status") widget_object = new Value(id, widget)
        else if (widget["widget"] == "control") widget_object = new Value(id, widget)
        else if (widget["widget"] == "input") widget_object = new Value(id, widget)
        else if (widget["widget"] == "button") widget_object = new Value(id, widget)
        else if (widget["widget"] == "calendar") widget_object = new Calendar(id, widget)
        else if (widget["widget"] == "image") widget_object = new Images(id, widget)
        else if (widget["widget"] == "map") widget_object = new Maps(id, widget)
        else if (widget["widget"] == "text") widget_object = new Text(id, widget)
        else if (widget["widget"] == "table") widget_object = new Table(id, widget)
        else if (widget["widget"] == "counter") widget_object = new Counter(id, widget)
        else if (widget["widget"] == "tasks") widget_object = new Tasks(id, widget)
        // system widgets
        else if (widget["widget"] == "packages") widget_object = new Packages(id, widget)
        else if (widget["widget"] == "modules") widget_object = new Modules(id, widget)
        else if (widget["widget"] == "sensors") widget_object = new Sensors(id, widget)
        else if (widget["widget"] == "logs") widget_object = new Logs(id, widget)
        else if (widget["widget"] == "rules") widget_object = new Rules(id, widget)
        else if (widget["widget"] == "chatbot") widget_object = new Chatbot(id, widget)
        else if (widget["widget"] == "configuration") widget_object = new Configuration(id, widget)
        else if (widget["widget"] == "icons") widget_object = new Icons(id, widget)
        else if (widget["widget"] == "database") widget_object = new Database(id, widget)
        else if (widget["widget"] == "gateway") widget_object = new Gateway(id, widget)
        else if (widget["widget"] == "notifications") widget_object = new Notifications(id, widget)
        else if (widget["widget"] == "marketplace") widget_object = new Marketplace(id, widget)
        else gui.log_error("unknown widget "+JSON.stringify(widget))
        if (widget_object != null) this.widget_objects.push(widget_object)
        return widget_object
    }
}