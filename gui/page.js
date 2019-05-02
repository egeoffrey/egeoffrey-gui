// handle the page
class Page {
    constructor(type, page) {
        this.widgets = []
        // if it is a user page, draw the layout provided by the user
        if (type == "USER") this.draw(page)
        // if it is a system page, build the layout and draw it
        else if (type == "SYSTEM") {
            if (page == "__modules") {
                this.draw([
                    {
                        "": [
                            {
                                "title": "Modules",
                                "size": 12,
                                "type": "modules"
                            }
                        ]
                    }
                ])
            }
            else if (page == "__sensors") {
                this.draw([
                    {
                        "": [
                            {
                                "title": "Registered Sensors",
                                "size": 12,
                                "type": "sensors"
                            }
                        ]
                    }
                ])
            }
            else if (page == "__logs") {
                this.draw([
                    {
                        "": [
                            {
                                "title": "Logs",
                                "size": 12,
                                "type": "logs"
                            }
                        ]
                    }
                ])
            }
            else if (page == "__rules") {
                this.draw([
                    {
                        "": [
                            {
                                "title": "Rules",
                                "size": 12,
                                "type": "rules"
                            }
                        ]
                    }
                ])
            }
            else if (page == "__icons") {
                this.draw([
                    {
                        "": [
                            {
                                "title": "Available Icons",
                                "size": 12,
                                "type": "icons"
                            }
                        ]
                    }
                ])
            }
            else if (page.startsWith("__sensor=")) {
                var request = page.split("=")
                var sensor_id = request[1]
                var page_layout = [
                    {
                        "sensor_id": [
                            {
                                "title": "Summary",
                                "size": 3,
                                "type": "summary",
                                "icon": "microchip",
                                "sensors": [ 
                                  sensor_id
                                ]
                            },
                            {
                                "title": "Timeline",
                                "size": 9,
                                "type": "timeline",
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
                                "type": "timeline",
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
                                "type": "timeline",
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
            else if (page.startsWith("__configuration")) {
                this.draw([
                    {
                        "": [
                            {
                                "title": "Configuration Editor",
                                "size": 12,
                                "type": "configuration",
                            }
                        ]
                    }
                ])
            }
        }
    }
    
    // draw the page
    draw(layout) {
        // clear up the page
        $("#body").empty()
        $("#body").append('<div id="page"></div>');
        // draw the page
        for (var row = 0; row < layout.length; row++) {
            var row_id = 'row_'+row
            // add a row
            for (var section in layout[row]) {
                // add a subtitle
                if (section != "") $("#page").append("<h2 class=\"page-header\">"+section+"</h2>")
                $("#page").append('<div class="row" id="'+row_id+'">')
                for (var column = 0; column < layout[row][section].length; column++) {
                    var widget = layout[row][section][column]
                    if (! gui.is_authorized(widget)) continue
                    var offset = 0;
                    if ("offset" in widget) offset = widget["offset"]
                    // add the column
                    var id = "widget_"+row+"_"+column
                    $("#"+row_id).append('<div class="col-lg-'+widget["size"]+' col-md-offset-'+offset+'" id="'+id+'">');
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
                        // configure the maximize button
                        // TODO: fix popup content without box
                        $("#"+id+"_popup").unbind().click(function(this_class, widget) {
                            return function () {
                                // clear the modal and load it
                                $("#popup_body").html("");
                                $("#popup_title").html(title);
                                var widget_object = this_class.add_widget("popup_body", widget)
                                if (widget_object != null) widget_object.draw()
                                $("#popup").modal()
                            };
                        }(this, widget));
                    }
                }
            }
        }
    }
    
    // close the current page
    close() {
        // close all the widget of the page
        for (var widget_object of this.widgets) {
            widget_object.close()
        }
    }
    
    // add the requested widget at the given html id
    add_widget(id, widget) {
        var widget_object = null
        // user widgets
        if (widget["type"] == "summary") widget_object = new Summary(id, widget)
        else if (widget["type"] == "timeline") widget_object = new Timeline(id, widget)
        else if (widget["type"] == "range") widget_object = new Range(id, widget)
        else if (widget["type"] == "value") widget_object = new Value(id, widget)
        else if (widget["type"] == "status") widget_object = new Value(id, widget)
        else if (widget["type"] == "control") widget_object = new Value(id, widget)
        else if (widget["type"] == "input") widget_object = new Value(id, widget)
        else if (widget["type"] == "button") widget_object = new Value(id, widget)
        else if (widget["type"] == "calendar") widget_object = new Calendar(id, widget)
        else if (widget["type"] == "image") widget_object = new Image(id, widget)
        // system widgets
        else if (widget["type"] == "modules") widget_object = new Modules(id, widget)
        else if (widget["type"] == "sensors") widget_object = new Sensors(id, widget)
        else if (widget["type"] == "logs") widget_object = new Logs(id, widget)
        else if (widget["type"] == "rules") widget_object = new Rules(id, widget)
        else if (widget["type"] == "chatbot") widget_object = new Chatbot(id, widget)
        else if (widget["type"] == "configuration") widget_object = new Configuration(id, widget)
        else if (widget["type"] == "icons") widget_object = new Icons(id, widget)
        else gui.log_error("unknown widget "+JSON.stringify(widget))
        this.widgets.push(widget_object)
        return widget_object
    }
}