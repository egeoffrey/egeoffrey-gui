// handle the page
class Page {
    constructor(type, page_id, page) {
        // keep track of page content and type
        this.page_id = page_id
        this.page = page
        this.type = type
        // map widget_id with the widget object
        this.widget_objects = {}
        // map each widget_id to the widget configuration
        this.widgets = {}
        // draw the page structure
        $("#page_wrapper").html('\
            <div class="content-header">\
                <div class="container-fluid">\
                    <div class="row mb-2">\
                        <div class="col-sm-6" id="page_header">\
                            <div class="form-group"><input type="text" id="page_id" class="form-control d-none" placeholder="page identifier"></div>\
                        </div>\
                        <div class="col-sm-6">\
                            <ol class="breadcrumb float-sm-right d-none" id="page_buttons">\
                                <li class="breadcrumb-item">\
                                    <button class="btn btn-default btn-sm" id="page_edit"><i class="fas fa-edit"></i> '+locale("page.edit")+'</button>\
                                    <button class="btn btn-default btn-sm edit_page_item d-none" id="page_add_row"><i class="fas fa-plus"></i> '+locale("page.add_row")+'</button>\
                                    <button class="btn btn-default d-none btn-sm edit_page_item" id="page_edit_cancel"><i class="fas fa-undo"></i> '+locale("page.discard_changes")+'</button>\
                                    <button class="btn btn-default d-none btn-sm edit_page_item" id="page_edit_done"><i class="fas fa-save"></i> '+locale("page.save_changes")+'</button>\
                                </li>\
                            </ol>\
                        </div>\
                    </div>\
                </div>\
            </div>\
            <section class="content">\
                <div class="container-fluid">\
                    <div id="body"></div>\
                    <div style="padding: 10px 0px; text-align: center;">\
                        <div class="text-muted"><a href="javascript:window.scrollTo(0,0);">'+locale("page.go_to_top")+'</a></div>\
                    </div>\
                </div>\
            </section>\
        ')
        if ( ! page_id.startsWith("__") && gui.is_authorized(["house_admins"])) $("#page_buttons").removeClass("d-none")
        // if it is a user page, draw the page layout provided by the user
        if (type == "USER") this.draw(page)
        // if it is a system page, build the page layout and draw it
        else if (type == "SYSTEM") {
            if (page_id == "__sensor") {
                if (! gui.is_authorized(["house_admins"])) return
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
                if (! gui.is_authorized(["house_admins"])) { this.unauthorized(); return }
                var widget_object = new Sensor_wizard("sensor_wizard", {})
                widget_object.draw()
            }
            else if (page_id == "__rule_wizard") {
                if (! gui.is_authorized(["house_admins"])) { this.unauthorized(); return }
                var widget_object = new Rule_wizard("rule_wizard", {})
                widget_object.draw()
            }
            else if (page_id == "__module_wizard") {
                if (! gui.is_authorized(["house_admins"])) { this.unauthorized(); return }
                var widget_object = new Module_wizard("module_wizard", {})
                widget_object.draw()
            }
            else if (page_id == "__menu_item_wizard") {
                if (! gui.is_authorized(["house_admins"])) { this.unauthorized(); return }
                var widget_object = new Menu_item_wizard("menu_item_wizard", {})
                widget_object.draw()
            }
            else if (page_id == "__menu_folder_wizard") {
                if (! gui.is_authorized(["house_admins"])) { this.unauthorized(); return }
                var widget_object = new Menu_folder_wizard("menu_folder_wizard", {})
                widget_object.draw()
            }
            else if (page_id == "__notifications") {
                var page_layout = [ 
                    {
                        "Notification Center": [
                        {
                            "size": 12,
                            "text": "Let's have a look if we have any interesting <b>notifications</b>. Notifications are generated whenever a configured rule triggers. If for example you want to be notified whenever the temperature of you refrigerator is too high, create a rule, schedule its execution and whenever the temperature will be higher than a configured threshold you will be notified. If you are an admin, you can configure your rules from the <a href='#__rules'>RULES</a> page so to trigger notifications generating <b>E-mail, Slack alerts, SMS messages, etc.</b> whenever a configured condition is met. Notifications can also be reviewed from the web interface thorugh the widgets below.",
                            "title": "Create your rules and receive notifications",
                            "widget": "text"
                          }
                        ]
                    },
                    {
                        "": [
                          {
                            "color": "red",
                            "icon": "ban",
                            "link": "__notifications=ALERT",
                            "scope": "alerts",
                            "sensor": "alert",
                            "size": 4,
                            "title": "Alerts",
                            "widget": "counter"
                          },
                          {
                            "color": "yellow",
                            "icon": "exclamation-triangle",
                            "link": "__notifications=WARNING",
                            "scope": "alerts",
                            "sensor": "warning",
                            "size": 4,
                            "title": "Warnings",
                            "widget": "counter"
                          },
                          {
                            "color": "info",
                            "icon": "info",
                            "link": "__notifications=INFO",
                            "scope": "alerts",
                            "sensor": "info",
                            "size": 4,
                            "title": "Informational",
                            "widget": "counter"
                          }
                        ]
                    },
                    {
                        "": [ 
                            { 
                                "title": "Latest Notifications", 
                                "size": 12, 
                                "widget": "notifications" 
                            } 
                        ] 
                    } 
                ]
                this.draw(page_layout)
            }
            else if (page_id == "__chatbot") {
                var page_layout = [ 
                    {
                        "Meet eGeoffrey": [
                          {
                            "size": 12,
                            "title": "Inteact with eGeoffrey in realtime",
                            "widget": "text",
                            "text": "Yes, you can <b>interact</b> with eGeoffrey. He is not the most easygoing entity but knows his stuff. <br>Say hi to him, ask about your registered sensors, trigger interactively your configured rules, eGeoffrey will do his best to <b>answer accordingly</b>! eGeoffrey is your e-butler who will take care of your house on your behalf <b>no need to configure anything</b>. The same level of interaction is also possible through Slack, Telegram, an attached microphone etc. by installing the required packages from our Marketplace."
                          }
                        ]
                    },
                    {
                        "": [
                          {
                            "size": 12,
                            "title": "Chat with me!",
                            "widget": "chatbot"
                          }
                        ]
                    }
                ]
                this.draw(page_layout)
            }
            else if (page_id == "__measures") {
                var page_layout = [
                    {
                        "Wha'ts new from your Sensors": [
                            {
                                "size": 12,
                                "title": "eGeoffrey and its sensors",
                                "text": "Let's have a look what's going on now and which <b>data has recently come in</b> from your sensors. No need to refresh anything, whenever a new value comes in will be immediately shown up at the top of the table! <br>A sensor in eGeoffrey is a sort of <b>dataset</b>, a logical container of <b>one or more values</b>: it can hold just a single piece of data or a timeseries. Sensor's values can come from an <b>associated service</b> (e.g. a url with an image, a command to run, etc.), from <b>actions triggered by a rule</b> or from your <b>interaction with widgets</b> on this interface.",
                                "widget": "text"
                            }
                        ]
                    },
                    {
                        "": [
                            {
                                "show_only": "value",
                                "size": 12,
                                "title": "Latest data from your sensors",
                                "widget": "notifications"
                            }
                        ]
                    }
                ]
                this.draw(page_layout)
            }
            else if (page_id == "__configuration") {
                if (! gui.is_authorized(["egeoffrey_admins"])) { this.unauthorized(); return }
                var page_layout = [ { "": [ { "title": "Configuration Editor", "size": 12, "widget": "__configuration" } ] } ]
                this.draw(page_layout)
            }
            else if (page_id == "__database") {
                if (! gui.is_authorized(["egeoffrey_admins"])) { this.unauthorized(); return }
                var page_layout = [ { "": [ { "title": "Database Inspector", "size": 12, "widget": "__database" } ] } ]
                this.draw(page_layout)
            }
            else if (page_id == "__gateway") {
                if (! gui.is_authorized(["egeoffrey_admins"])) { this.unauthorized(); return }
                var page_layout = [ { "": [ { "title": "Gateway Inspector", "size": 12, "widget": "__gateway" } ] } ]
                this.draw(page_layout)
            }
            else if (page_id == "__setup") {
                if (! gui.is_authorized(["house_admins"])) { this.unauthorized(); return }
                var page_layout = [ 
                    { 
                        "Your House": 
                            [ 
                                { 
                                    "title": " ", 
                                    "size": 12, 
                                    "widget": "text",
                                    "text": '<i class="fas fa-question-circle text-blue"></i> From this page you can go through very simple steps to perform a basic setup of your house like giving it a name, setting up its position etc. You can also configure common settings of this web interface. For more information on this page, visit our <a target="_new" href="https://docs.egeoffrey.com/setup/house/">Documentation Portal</a>'
                                } 
                            ] 
                    },
                    { 
                        "": 
                            [ 
                                { 
                                    "title": "House Setup", 
                                    "size": 12, 
                                    "widget": "__setup" 
                                } 
                            ] 
                    } 
                ]
                this.draw(page_layout)
            }
            else if (page_id == "__pages") {
                if (! gui.is_authorized(["house_admins"])) { this.unauthorized(); return }
                var page_layout = [ 
                    { 
                        "Create Your Custom Pages": 
                            [ 
                                { 
                                    "title": " ", 
                                    "size": 12, 
                                    "widget": "text",
                                    "text": '<i class="fas fa-question-circle text-blue"></i> A page is what you ultimately access through the web interface and is used to display sensors\' contents in a variatiy of ways. A page is made up of multiple rows and every row have one or more widget (in columns). Once your page is ready, you need to add a menu entry in order to access it from the main menu. For more information on this page, visit our <a target="_new" href="https://docs.egeoffrey.com/configure/pages/">Documentation Portal</a>'
                                } 
                            ] 
                    },
                    { 
                        "": 
                            [ 
                                { 
                                    "title": '<i class="fa fa-columns"></i> Custom Pages',
                                    "size": 12, 
                                    "widget": "__pages" 
                                } 
                            ] 
                    } 
                ]
                this.draw(page_layout)
            }
            else if (page_id == "__menu") {
                if (! gui.is_authorized(["house_admins"])) { this.unauthorized(); return }
                var page_layout = [ 
                    { 
                        "Customize Your Menu": 
                            [ 
                                { 
                                    "title": " ", 
                                    "size": 12, 
                                    "widget": "text",
                                    "text": '<i class="fas fa-question-circle text-blue"></i> The "MY HOUSE" area of the left menu contains the links to user-defined pages and it is completely up to you the way you want to organize your contents. Since your pages will be ultimately accessible through the menu, you need to link them by creating a so-called menu item. Menu items have to belong to a menu folder so that pages which are logically linked together can be grouped. For more information on this page, visit our <a target="_new" href="https://docs.egeoffrey.com/configure/pages/">Documentation Portal</a>'
                                } 
                            ] 
                    },
                    { 
                        "": 
                            [ 
                                { 
                                    "title": '<i class="fa fa-folder-open"></i> Menu Folders', 
                                    "size": 12, 
                                    "widget": "__menu_folders" 
                                }
                            ] 
                    },
                    { 
                        "": 
                            [ 
                                { 
                                    "title": '<i class="fa fa-copy"></i> Menu Items', 
                                    "size": 12, 
                                    "widget": "__menu_items" 
                                }
                            ] 
                    } 
                ]
                this.draw(page_layout)
            }
            else if (page_id == "__users") {
                if (! gui.is_authorized(["house_admins"])) { this.unauthorized(); return }
                var page_layout = [ 
                    { 
                        "Manage Your Users": 
                            [ 
                                { 
                                    "title": "", 
                                    "size": 12, 
                                    "widget": "text",
                                    "text": '<i class="fas fa-question-circle text-blue"></i> You can optionally configure different users to access the web interface or set/change the password the out-of-the-box users admin and guest. Managing users is not strictly required in eGeoffrey but in case you want to prevent anonymous users to access or give different users access to different pages, you can start exploring these functionalities. For more information on this page, visit our <a target="_new" href="https://docs.egeoffrey.com/configure/users/">Documentation Portal</a>'
                                } 
                            ] 
                    },
                    { 
                        "": 
                            [ 
                                { 
                                    "title": '<i class="fa fa-users"></i> Users and Groups', 
                                    "size": 12, 
                                    "widget": "__users" 
                                } 
                            ] 
                    } 
                ]
                this.draw(page_layout)
            }
            else if (page_id == "__logs") {
                if (! gui.is_authorized(["egeoffrey_admins"])) { this.unauthorized(); return }
                var page_layout = [ { "": [ { "title": "Log Inspector", "size": 12, "widget": "__logs" } ] } ]
                this.draw(page_layout)
            }
            else if (page_id == "__modules") {
                if (! gui.is_authorized(["egeoffrey_admins"])) { this.unauthorized(); return }
                var page_layout = [ 
                    { 
                        "Running Modules": 
                            [ 
                                { 
                                    "title": " ", 
                                    "size": 12, 
                                    "widget": "text",
                                    "text": '<i class="fas fa-question-circle text-blue"></i> A module is defined as a unit providing a specific functionality to eGeoffrey. Once you install a package, this provides one or more modules. There are different kind of modules: Controller are modules part of the eGeoffrey core (e.g. interact with the database, collect data from sensors, run alerting rules, etc.), interaction are modules responsible for interacting with the user (e.g. through Slack, a microphone, etc.), notification are modules responsible for notifying the user about something (e.g. through email, slack, text messages, etc.), service are modules responsible for interfacing with a specific device or protocol to retrieve data or control actuators (e.g. a weather service, a webcam, a MySensors device, Zigbee protocol, etc.), gui are modules responsible for running the eGeoffrey GUI. For more information on this page, visit our <a target="_new" href="https://docs.egeoffrey.com/configure/modules/">Documentation Portal</a>'
                                } 
                            ] 
                    },
                    { 
                        "": 
                            [ 
                                { 
                                    "title": '<i class="fa fa-server"></i> Modules', 
                                    "size": 12, 
                                    "widget": "__modules" 
                                } 
                            ] 
                    } 
                ]
                this.draw(page_layout)
            }
            else if (page_id == "__packages") {
                if (! gui.is_authorized(["egeoffrey_admins"])) { this.unauthorized(); return }
                var page_layout = [ 
                    { 
                        "Installed Packages": 
                            [ 
                                { 
                                    "title": '', 
                                    "size": 12, 
                                    "widget": "text",
                                    "text": '<i class="fas fa-question-circle text-blue"></i> A package is defined as one or more modules (e.g. functionalities) packaged together. It may also include sample contents such as sensors, rules or pages. Packages are what you can find in the eGeoffrey\'s Marketplace and it is what you install when you need specific new skills added to your eGeoffrey. For more information on this page, visit our <a target="_new" href="https://docs.egeoffrey.com/configure/packages/">Documentation Portal</a>'
                                } 
                            ] 
                    },
                    { 
                        "": 
                            [ 
                                { 
                                    "title": '<i class="fa fa-cubes"></i> Packages', 
                                    "size": 12, 
                                    "widget": "__packages" 
                                } 
                            ] 
                    } 
                ]
                this.draw(page_layout)
            }
            else if (page_id == "__rules") {
                if (! gui.is_authorized(["house_admins"])) { this.unauthorized(); return }
                var page_layout = [ 
                    { 
                        "Manage Your Rules": 
                            [ 
                                { 
                                    "title": " ", 
                                    "size": 12, 
                                    "widget": "text",
                                    "text": '<i class="fas fa-question-circle text-blue"></i> Rules can execute specific tasks periodically or upon specific conditions. A rule is defined as a set constants (e.g. static values) and variables (e.g. values coming from sensors) combined in conditions. Notifications are generated whenever a configured rule triggers. Rules can also execute additional actions (e.g. set a value to a sensor, trigger another rule, etc.). For more information on this page, visit our <a target="_new" href="https://docs.egeoffrey.com/configure/rules/">Documentation Portal</a>'
                                } 
                            ] 
                    },
                    { 
                        "": 
                            [ 
                                { 
                                    "title": '<i class="fa fa-cogs"></i> Configured Rules', 
                                    "size": 12, 
                                    "widget": "__rules" 
                                } 
                            ] 
                    } 
                ]
                this.draw(page_layout)
            }
            else if (page_id == "__sensors") {
                if (! gui.is_authorized(["house_admins"])) { this.unauthorized(); return }
                var page_layout = [ 
                    { 
                        "Manage Your Sensors": 
                            [ 
                                { 
                                    "title": " ", 
                                    "size": 12, 
                                    "widget": "text",
                                    "text": '<i class="fas fa-question-circle text-blue"></i> A sensor is defined as a dataset, a logical container of one or more values. it can hold just a single piece of data or a timeseries. Values can come from an associated service (e.g. a url with an image, a command to run, etc.), from actions triggered by a rule or from your interaction with widgets on the web interface. A sensor is made of an id (e.g. the way you will references it) and additional information like retention policies, associated services, etc. For more information on this page, visit our <a target="_new" href="https://docs.egeoffrey.com/configure/sensors/">Documentation Portal</a>'
                                } 
                            ] 
                    },
                    { 
                        "": 
                            [ 
                                { 
                                    "title": '<i class="fa fa-microchip"></i> Registered Sensors', 
                                    "size": 12, 
                                    "widget": "__sensors" 
                                } 
                            ] 
                    } 
                ]
                this.draw(page_layout)
            }
            else if (page_id == "__welcome") {
                var page_layout = [
                  {
                    "I'm eGeoffrey, your e-butler": [
                      {
                        "size": 12,
                        "title": '<i class="fas fa-robot"></i>  Welcome!',
                        "text": 'Through the eGeoffrey\'s web user interface you can control any aspect of your <b>personal e-butler</b>. It is the easiest and simplest way to <b>configure</b> your eGeoffrey\'s instance, register new <b>sensors</b>, <b>view your data</b>, control your <b>actuators</b>, configure <b>rules</b> which will trigger one or more notification upon specific conditions. And how data is displayed is completely up to you, you can <b>organize</b> your contents in the way you like the most and create new, custom pages. No need to edit complicated configuration files, everything can be accomplished from here!',
                        "widget": "text"
                      }
                    ]
                  },
                  {
                    "": [
                      {
                        "size": 12,
                        "text": 'Either if you are a user or an admin, the best way to start is to have a look at our <b><a target="_new" href="https://docs.egeoffrey.com/configure/workflow/">Documentation Portal</a></b> for step-by-step instructions and HOW TOs in which you will learn how to: <ul><li><b>Define what you want to do and install the relevant packages</b>: eGeoffrey is modular and its capabilities are build up in self-contained components. Those are what you see listed in the <b><a target="_new" href="https://marketplace.egeoffrey.com">Marketplace</a></b>. Define first what you want to do (e.g. get temperature measures from the Internet, trigger a MySensors relay, etc.), find in the Marketplace the package providing this capability (e.g. the module in eGeoffrey\'s vocabulary) and install it; </li><li><b>Configure the newly installed module:</b> once the package is installed, the new functionalities will be ready to be leveraged. Most of the modules tough requires some basic configuration to start up (e.g. the API key of the cloud-based weather service, the serial port to connect to, etc.). One special kind of module is called "service", this is the one your sensors can leverage to get data in automatically; </li><li><b>Add a new sensor and associate it to a service:</b> register a new sensor, give it a name, tell eGeoffrey which format it has to expect your data in, if it has to apply any automatic aggregation or retention policies, which service it has to be associated with for getting data in or performing actions; </li><li><b>Once the sensor starts getting data, visualize it:</b> customize the web interface to make your data showing up in the way you like the most. Add new pages and different widgets to e.g. see the latest value of a sensor, control your actuators, etc. </li><li><b>Set conditions which would make rules triggering notifications:</b> execute specific tasks periodically or when given conditions are met by evaluating your sensors\' data and generate notifications;</li></ul><br>And for any additional question, in our <b><a target="_new" href="https://forum.egeoffrey.com">Forum</a></b> you can meet our community, get useful advices and share best practices.',
                        "title": '<i class="fas fa-book-open"></i> Getting Started',
                        "widget": "text"
                      }
                    ]
                  },
                  {
                    "": [
                      {
                        "size": 12,
                        "title": '<i class="fas fa-bug"></i> Found a bug or looking for enhancements?',
                        "text": 'If you discovered a bug or want to submit an enhancement request, you are encouraged to visit first both our <b><a target="_new" href="https://forum.egeoffrey.com">Forum</a></b> to ensure the issue has bot been discussed already by other users and visit our and <b><a target="_new" href="https://github.com/egeoffrey">Github</a></b> page, where you can find for each eGeoffrey components opened issues and enhancement requests submitted by other users. If you cannot find what you are looking for, simply open up a new issue!',
                        "widget": "text"
                      }
                    ]
                  },
                  {
                    "": [
                      {
                        "size": 12,
                        "title": '<i class="fas fa-code"></i> Willing to contribute?',
                        "text": 'eGeoffrey skills\' are endless and, whatever skill you have in mind, eGeoffrey will <b>learn</b> it to satisfy your needs with its best smile. And maybe another user has already taught his eGeoffrey to do exactly what you needed. if you want to extend eGeoffrey and make it better, visit our website for <b><a target="_new" href="https://developer.egeoffrey.com">Developers</a></b> to understand more about its architecture and internals and guidelines on how to contribute.',
                        "widget": "text"
                      }
                    ]
                  }
                ]
                this.draw(page_layout)
            }
        }
    }
    
    // print an error message when the user is not authorized to access the page
    unauthorized() {
        $("#body").empty()
        $("#body").append('<center><h3>You are not authorized to access this page</h3></center>');
    }
    
    // add a new row to the page
    add_row(row, title) {
        // add row
        $("#page").append('\
            <div class="row_block">\
                <h2 class="page-header" id="title_row_'+row+'">\
                    <center>\
                        <span id="title_text_row_'+row+'" class="no_edit_page_item">'+title+'</span> \
                        <input id="title_input_row_'+row+'" type="text" value="'+title+'" class="edit_page_item d-none" placeholder="give this row a title...">\
                        <button class="btn btn-default d-none btn-sm edit_page_item" id="delete_row_'+row+'"><i class="fas fa-trash-alt"></i> Delete Row</button>\
                        <button class="btn btn-default btn-sm edit_page_item d-none sortable_row" style="cursor: move;"><i class="fas fa-arrows-alt"></i> Move Row</button>\
                        <button class="btn btn-default btn-sm edit_page_item d-none" id="add_widget_row_'+row+'"><i class="fas fa-plus"></i> Add Widget</button>\
                    </center>\
                </h2>\
                <div class="row connected_widgets" id="row_'+row+'"></div>\
            </div>\
        ')
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
                gui.confirm("Do you really want to delete the row and all its the widgets?", function(result){ 
                    if (! result) return
                    // remove both the title and the entire row
                    $("#title_row_"+row).remove()
                    $("#row_"+row).remove()
                })
            };
        }(this, row));
        // configure add widget button
        $("#add_widget_row_"+row).unbind().click(function(this_class, row) {
            return function () {
                this_class.widget_wizard(row)
            };
        }(this, row));
        // make the widgets in the row sortable
        var this_class = this
        $("#row_"+row).sortable({
            placeholder: 'sort-highlight',
            connectWith: '.connected_widgets',
            handle: '.sortable_widget',
            tolerance: 'pointer',
            distance: 0.5,
            forcePlaceholderSize: false,
            cancel: '',
            dropOnEmpty: true,
            zIndex: 999999,
        })
    }
    
    // add column
   add_column(row, column, size, offset) {
        var id = "widget_"+row+"_"+column
        $("#row_"+row).append('<section class="col-lg-'+size+' offset-md-'+offset+'" id="'+id+'"></section>')
        return id
    }
    
    // return a random number
    get_random() {
        var min = 1; 
        var max = 100000;
        return Math.floor(Math.random() * (+max - +min)) + +min;
    }
    
    // add an array item to the widget wizard form
    widget_wizard_add_array_item(id, value="") {
        var i = this.get_random()
        var html = '\
            <div class="row" id="'+id+'_row_'+i+'">\
                <div class="col-11">\
                    <input type="text" id="'+id+'_value_'+i+'" class="form-control" value="'+value+'" required>\
                </div>\
                <div class="col-1">\
                    <button type="button" class="btn btn-default">\
                        <i class="fas fa-times text-red" id="'+id+'_remove_'+i+'"></i>\
                    </button>\
                </div>\
            </div>\
        '
        $("#"+id).append(html)
        // configure remove button
        $("#"+id+"_remove_"+i).unbind().click(function(id, i) {
            return function () {
                $("#"+id+"_row_"+i).remove()
            };
        }(id, i));
    }
    
    // add/edit a widget
    widget_wizard(id, widget=null) {
        //if widget is null, this is a new widget and id is the row number
        var is_new = widget == null ? true : false
        if (is_new) {
            var row = id
            id = ""
        }
        // clear up the modal
        $("#wizard_body").html("")
        $("#wizard_title").html("Widget Configuration")
        // show the modal
        $("#wizard").modal()
        // build the form
        $("#wizard_body").append('\
            <form method="POST" role="form" id="'+id+'_form" class="needs-validation" novalidate>\
                <ul class="nav nav-tabs" id="'+id+'_tabs" role="tablist">\
                    <li class="nav-item">\
                        <a class="nav-link active" id="'+id+'_tab_general" data-toggle="pill" href="#'+id+'_tab_general_content" role="tab" aria-controls="'+id+'_tab_general_content" aria-selected="true">General</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_summary" data-toggle="pill" href="#'+id+'_tab_summary_content"  role="tab" aria-controls="'+id+'_tab_summary_content" aria-selected="false">Summary</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_timeline" data-toggle="pill" href="#'+id+'_tab_timeline_content"  role="tab" aria-controls="'+id+'_tab_timeline_content" aria-selected="false">Timeline</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_range" data-toggle="pill" href="#'+id+'_tab_range_content"  role="tab" aria-controls="'+id+'_tab_range_content" aria-selected="false">Range</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_value" data-toggle="pill" href="#'+id+'_tab_value_content"  role="tab" aria-controls="'+id+'_tab_value_content" aria-selected="false">Value</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_status" data-toggle="pill" href="#'+id+'_tab_status_content"  role="tab" aria-controls="'+id+'_tab_status_content" aria-selected="false">Status</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_control" data-toggle="pill" href="#'+id+'_tab_control_content"  role="tab" aria-controls="'+id+'_tab_control_content" aria-selected="false">Control</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_input" data-toggle="pill" href="#'+id+'_tab_input_content"  role="tab" aria-controls="'+id+'_tab_input_content" aria-selected="false">Input</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_button" data-toggle="pill" href="#'+id+'_tab_button_content"  role="tab" aria-controls="'+id+'_tab_button_content" aria-selected="false">Button</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_calendar" data-toggle="pill" href="#'+id+'_tab_calendar_content"  role="tab" aria-controls="'+id+'_tab_calendar_content" aria-selected="false">Calendar</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_image" data-toggle="pill" href="#'+id+'_tab_image_content"  role="tab" aria-controls="'+id+'_tab_image_content" aria-selected="false">Image</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_map" data-toggle="pill" href="#'+id+'_tab_map_content"  role="tab" aria-controls="'+id+'_tab_map_content" aria-selected="false">Map</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_text" data-toggle="pill" href="#'+id+'_tab_text_content"  role="tab" aria-controls="'+id+'_tab_text_content" aria-selected="false">Text</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_table" data-toggle="pill" href="#'+id+'_tab_table_content"  role="tab" aria-controls="'+id+'_tab_table_content" aria-selected="false">Table</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_counter" data-toggle="pill" href="#'+id+'_tab_counter_content"  role="tab" aria-controls="'+id+'_tab_counter_content" aria-selected="false">Counter</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_tasks" data-toggle="pill" href="#'+id+'_tab_tasks_content"  role="tab" aria-controls="'+id+'_tab_tasks_content" aria-selected="false">Tasks</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_logs" data-toggle="pill" href="#'+id+'_tab_logs_content"  role="tab" aria-controls="'+id+'_tab_logs_content" aria-selected="false">Logs</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_notifications" data-toggle="pill" href="#'+id+'_tab_notifications_content"  role="tab" aria-controls="'+id+'_tab_notifications_content" aria-selected="false">Notifications</a>\
                    </li>\
                    \
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_slider" data-toggle="pill" href="#'+id+'_tab_slider_content"  role="tab" aria-controls="'+id+'_tab_slider_content" aria-selected="false">Slider</a>\
                    </li>\
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+id+'_tab_heartbeat" data-toggle="pill" href="#'+id+'_tab_heartbeat_content"  role="tab" aria-controls="'+id+'_tab_heartbeat_content" aria-selected="false">Heartbeat</a>\
                    </li>\
                    \
                    <li class="nav-item">\
                        <a class="nav-link" id="'+id+'_tab_permissions" data-toggle="pill" href="#'+id+'_tab_permissions_content"  role="tab" aria-controls="'+id+'_tab_permissions_content" aria-selected="false">Permissions</a>\
                    </li>\
                    \
                </ul>\
                <div class="tab-content">\
                    <div class="tab-pane fade show active" id="'+id+'_tab_general_content" role="tabpanel" aria-labelledby="'+id+'_tab_general">\
                        <div class="form-group">\
                            <label>Widget Title*</label>\
                            <input type="text" id="'+id+'_general_title" value="" class="form-control" placeholder="title of the widget">\
                        </div>\
                        <div class="form-group">\
                            <label>Size of the widget*</label>\
                            <select id="'+id+'_general_size" class="form-control" required>\
                                <option value="1">1</option>\
                                <option value="2">2</option>\
                                <option value="3">3</option>\
                                <option value="4">4</option>\
								<option value="5">5</option>\
                                <option value="6">6</option>\
                                <option value="7">7</option>\
                                <option value="8">8</option>\
                                <option value="9">9</option>\
                                <option value="10">10</option>\
                                <option value="11">11</option>\
                                <option value="12">12</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Widget Type*</label>\
                            <select id="'+id+'_general_widget" class="form-control" required>\
                                <option value=""></option>\
                                <option value="summary">Summary - display the latest value together with min/max of yesterday/today</option>\
                                <option value="value">Value - display the latest value of a sensor</option>\
                                <option value="timeline">Timeline - display a timeline chart</option>\
                                <option value="range">Range - display a chart with min and max values</option>\
                                <option value="status">Status - display an on/off status</option>\
                                <option value="control">Control an on/off switch</option>\
                                <option value="input">Input - display an input box</option>\
                                <option value="button">Button - display a button and associate actions</option>\
                                <option value="calendar">Calendar - display a calendar for scheduling events</option>\
                                <option value="image">Image - display an image stored in a sensor</option>\
                                <option value="map">Map - display a map plotting positions stored in a sensor</option>\
                                <option value="text">Text - display a text statically or from a sensor</option>\
                                <option value="table">Table - display a dynamic table</option>\
                                <option value="counter">Counter - display counter of the values stored in a sensor</option>\
                                <option value="tasks">Tasks - display a to-do list</option>\
                                <option value="notifications">Notifications - list the latest notifications</option>\
                                <option value="chatbot">Chatbot - display the interactive chatbot</option>\
                                <option value="slider">Slider - display a range slider</option>\
								<option value="heartbeat">Heartbeat - display an elapsed since last heartbeat</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Widget Offset</label>\
                            <select id="'+id+'_general_offset" class="form-control">\
                                <option value=""></option>\
                                <option value="1">1</option>\
                                <option value="2">2</option>\
                                <option value="3">3</option>\
                                <option value="4">4</option>\
                                <option value="5">5</option>\
                                <option value="6">6</option>\
                                <option value="7">7</option>\
                                <option value="8">8</option>\
                                <option value="9">9</option>\
                                <option value="10">10</option>\
                                <option value="11">11</option>\
                                <option value="12">12</option>\
                            </select>\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_summary_content" role="tabpanel" aria-labelledby="'+id+'_tab_summary">\
                        <div class="form-group">\
                            <label>Sensors to Plot*</label>\
                            <div id="'+id+'_summary_sensors"></div>\
                            <br>\
                            <div class="form-group">\
                                <button type="button" class="btn btn-default float-right" id="'+id+'_summary_sensors_add"><i class="fas fa-plus"></i> Add Sensor</button>\
                            </div>\
                        </div>\
                        <div class="form-group">\
                            <label>Icon</label>\
                            <select id="'+id+'_summary_icon" class="form-control"></select>\
                        </div>\
                        <div class="form-group">\
                            <label>Color of the icon</label>\
                            <select id="'+id+'_summary_color" class="form-control">\
                                <option value=""></option>\
                                <option value="black">black</option>\
                                <option value="gray">gray</option>\
                                <option value="silver">silver</option>\
                                <option value="white">white</option>\
                                <option value="aqua">aqua</option>\
                                <option value="blue">blue</option>\
                                <option value="navy">navy</option>\
                                <option value="teal">teal</option>\
                                <option value="green">green</option>\
                                <option value="olive">olive</option>\
                                <option value="lime">lime</option>\
                                <option value="yellow">yellow</option>\
                                <option value="orange">orange</option>\
                                <option value="red">red</option>\
                                <option value="fuchsia">fuchsia</option>\
                                <option value="purple">purple</option>\
                                <option value="maroon">maroon</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Icon from a sensor</label>\
                            <input type="text" id="'+id+'_summary_icon_sensor" class="form-control" placeholder="the sensor from which the icon has to be taken from. Default is the static icon above">\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_timeline_content" role="tabpanel" aria-labelledby="'+id+'_tab_timeline">\
                        <div class="form-group">\
                            <label>Sensors to Plot*</label>\
                            <div id="'+id+'_timeline_sensors"></div>\
                            <br>\
                            <div class="form-group">\
                                <button type="button" class="btn btn-default float-right" id="'+id+'_timeline_sensors_add"><i class="fas fa-plus"></i> Add Sensor</button>\
                            </div>\
                        </div>\
                        <div class="form-group">\
                            <label>Display Aggregated Data</label>\
                            <select id="'+id+'_timeline_group_by" class="form-control">\
                                <option value="">Show series with latest measures</option>\
                                <option value="hour">Show series with hourly averages</option>\
                                <option value="day">Show series with daily averages</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Chart Style</label>\
                            <input type="text" id="'+id+'_timeline_style" class="form-control" placeholder="Style of the chart. Default to spline">\
                        </div>\
                        <div class="form-group">\
                            <label>Custom Series to Display</label>\
                            <input type="text" id="'+id+'_timeline_series" class="form-control" placeholder="if displaying a custom series like \'sum\'">\
                        </div>\
                        <div class="form-group">\
                            <label>Custom Timeframe</label>\
                            <input type="text" id="'+id+'_timeline_timeframe" class="form-control" placeholder="Custom timeframe in the format last_24_hours. Best fit if not selected">\
                        </div>\
                        <div class="form-group">\
                            <label>Range with Min and Max is Displayed for First Sensor. Check for Not Displaying</label>\
                            <input type="checkbox" class="form-control" id="'+id+'_timeline_no_range">\
                        </div><br>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_range_content" role="tabpanel" aria-labelledby="'+id+'_tab_range">\
                        <div class="form-group">\
                            <label>Sensor*</label>\
                            <input type="text" id="'+id+'_range_sensor" class="form-control" placeholder="the sensor whose value has to be displayed" required>\
                        </div>\
                        <div class="form-group">\
                            <label>Display Aggregated Data</label>\
                            <select id="'+id+'_range_group_by" class="form-control">\
                                <option value="">Show series with latest measures</option>\
                                <option value="hour">Show series with hourly averages</option>\
                                <option value="day">Show series with daily averages</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Custom Timeframe</label>\
                            <input type="text" id="'+id+'_range_timeframe" class="form-control" placeholder="Custom timeframe in the format last_24_hours. Best fit if not selected">\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_value_content" role="tabpanel" aria-labelledby="'+id+'_tab_value">\
                        <div class="form-group">\
                            <label>Sensor*</label>\
                            <input type="text" id="'+id+'_value_sensor" class="form-control" placeholder="the sensor whose value has to be displayed" required>\
                        </div>\
                        <div class="form-group">\
                            <label>Icon</label>\
                            <select id="'+id+'_value_icon" class="form-control"></select>\
                        </div>\
                        <div class="form-group">\
                            <label>Color of the icon</label>\
                            <select id="'+id+'_value_color" class="form-control">\
                                <option value=""></option>\
                                <option value="black">black</option>\
                                <option value="gray">gray</option>\
                                <option value="silver">silver</option>\
                                <option value="white">white</option>\
                                <option value="aqua">aqua</option>\
                                <option value="blue">blue</option>\
                                <option value="navy">navy</option>\
                                <option value="teal">teal</option>\
                                <option value="green">green</option>\
                                <option value="olive">olive</option>\
                                <option value="lime">lime</option>\
                                <option value="yellow">yellow</option>\
                                <option value="orange">orange</option>\
                                <option value="red">red</option>\
                                <option value="fuchsia">fuchsia</option>\
                                <option value="purple">purple</option>\
                                <option value="maroon">maroon</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Elapsed from a different sensor</label>\
                            <input type="text" id="'+id+'_value_timestamp_sensor" class="form-control" placeholder="the sensor from which the elapsed timestamp has to be taken from. Default from the associated sensor above">\
                        </div>\
                        <div class="form-group">\
                            <label>Icon from a sensor</label>\
                            <input type="text" id="'+id+'_value_icon_sensor" class="form-control" placeholder="the sensor from which the icon has to be taken from. Default is the static icon above">\
                        </div>\
                        <div class="form-group">\
                            <label>Widget Style</label>\
                            <input type="text" id="'+id+'_value_variant" class="form-control" placeholder="1 (default) for small box, 2 for larger box">\
                        </div>\
                        <div class="form-group">\
                            <label>Value in green if between this range</label>\
                            <input type="text" id="'+id+'_value_color_success" class="form-control" placeholder="The range (e.g. 0-60) or the value for applying the color">\
                        </div>\
                        <div class="form-group">\
                            <label>Value in yellow if between this range</label>\
                            <input type="text" id="'+id+'_value_color_warning" class="form-control" placeholder="The range (e.g. 61-80) or the value for applying the color">\
                        </div>\
                        <div class="form-group">\
                            <label>Value in red if between this range</label>\
                            <input type="text" id="'+id+'_value_color_danger" class="form-control" placeholder="The range (e.g. 81-100) or the value for applying the color">\
                        </div>\
                        <div class="form-group">\
                            <label>Normalize the value to a percentage between the following range</label>\
                            <input type="text" id="'+id+'_value_normalize" class="form-control" placeholder="e.g. 1.8-33">\
                        </div>\
                        <div class="form-group">\
                            <label>Show All Link</label>\
                            <input type="text" id="'+id+'_value_link" class="form-control" placeholder="link for the \'Show All\' link. Applicable for style 2 widgets only">\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_status_content" role="tabpanel" aria-labelledby="'+id+'_tab_status">\
                        <div class="form-group">\
                            <label>Sensor*</label>\
                            <input type="text" id="'+id+'_status_sensor" class="form-control" placeholder="the sensor whose status has to be displayed" required>\
                        </div>\
                        <div class="form-group">\
                            <label>Icon when ON (default: plug)</label>\
                            <select id="'+id+'_status_icon_on" class="form-control"></select>\
                        </div>\
                        <div class="form-group">\
                            <label>Color when ON (default: green)</label>\
                            <select id="'+id+'_status_color_on" class="form-control">\
                                <option value=""></option>\
                                <option value="black">black</option>\
                                <option value="gray">gray</option>\
                                <option value="silver">silver</option>\
                                <option value="white">white</option>\
                                <option value="aqua">aqua</option>\
                                <option value="blue">blue</option>\
                                <option value="navy">navy</option>\
                                <option value="teal">teal</option>\
                                <option value="green">green</option>\
                                <option value="olive">olive</option>\
                                <option value="lime">lime</option>\
                                <option value="yellow">yellow</option>\
                                <option value="orange">orange</option>\
                                <option value="red">red</option>\
                                <option value="fuchsia">fuchsia</option>\
                                <option value="purple">purple</option>\
                                <option value="maroon">maroon</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Text when ON (default: ON)</label>\
                            <input type="text" id="'+id+'_status_text_on" class="form-control"></select>\
                        </div>\
                        <div class="form-group">\
                            <label>Icon when OFF (default: power-off)</label>\
                            <select id="'+id+'_status_icon_off" class="form-control"></select>\
                        </div>\
                        <div class="form-group">\
                            <label>Color when OFF (default: red)</label>\
                            <select id="'+id+'_status_color_off" class="form-control">\
                                <option value=""></option>\
                                <option value="black">black</option>\
                                <option value="gray">gray</option>\
                                <option value="silver">silver</option>\
                                <option value="white">white</option>\
                                <option value="aqua">aqua</option>\
                                <option value="blue">blue</option>\
                                <option value="navy">navy</option>\
                                <option value="teal">teal</option>\
                                <option value="green">green</option>\
                                <option value="olive">olive</option>\
                                <option value="lime">lime</option>\
                                <option value="yellow">yellow</option>\
                                <option value="orange">orange</option>\
                                <option value="red">red</option>\
                                <option value="fuchsia">fuchsia</option>\
                                <option value="purple">purple</option>\
                                <option value="maroon">maroon</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Text when OFF (default: OFF)</label>\
                            <input type="text" id="'+id+'_status_text_off" class="form-control"></select>\
                        </div>\
                        <div class="form-group">\
                            <label>Elapsed from a different sensor</label>\
                            <input type="text" id="'+id+'_status_timestamp_sensor" class="form-control" placeholder="the sensor from which the elapsed timestamp has to be taken from. Default from the associated sensor above">\
                        </div>\
                        <div class="form-group">\
                            <label>Widget Style</label>\
                            <input type="text" id="'+id+'_status_variant" class="form-control" placeholder="1 (default) for small box, 2 for larger box">\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_control_content" role="tabpanel" aria-labelledby="'+id+'_tab_control">\
                        <div class="form-group">\
                            <label>Associated Sensor*</label>\
                            <input type="text" id="'+id+'_control_sensor" class="form-control" placeholder="the sensor where to save the value of this widget" required>\
                        </div>\
                        <div class="form-group">\
                            <label>Additional Actions to Execute</label>\
                            <div id="'+id+'_control_actions"></div>\
                            <br>\
                            <div class="form-group">\
                                <button type="button" class="btn btn-default float-right" id="'+id+'_control_actions_add"><i class="fas fa-plus"></i> Add Action</button>\
                            </div>\
                        </div>\
                        <div class="form-group">\
                            <label>Icon</label>\
                            <select id="'+id+'_control_icon" class="form-control"></select>\
                        </div>\
                        <div class="form-group">\
                            <label>Color of the icon</label>\
                            <select id="'+id+'_control_color" class="form-control">\
                                <option value=""></option>\
                                <option value="black">black</option>\
                                <option value="gray">gray</option>\
                                <option value="silver">silver</option>\
                                <option value="white">white</option>\
                                <option value="aqua">aqua</option>\
                                <option value="blue">blue</option>\
                                <option value="navy">navy</option>\
                                <option value="teal">teal</option>\
                                <option value="green">green</option>\
                                <option value="olive">olive</option>\
                                <option value="lime">lime</option>\
                                <option value="yellow">yellow</option>\
                                <option value="orange">orange</option>\
                                <option value="red">red</option>\
                                <option value="fuchsia">fuchsia</option>\
                                <option value="purple">purple</option>\
                                <option value="maroon">maroon</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Text when ON (default: On)</label>\
                            <input type="text" id="'+id+'_control_text_on" class="form-control"></select>\
                        </div>\
                        <div class="form-group">\
                            <label>Text when OFF (default: Off)</label>\
                            <input type="text" id="'+id+'_control_text_off" class="form-control"></select>\
                        </div>\
                        <div class="form-group">\
                            <label>Elapsed from a different sensor</label>\
                            <input type="text" id="'+id+'_control_timestamp_sensor" class="form-control" placeholder="the sensor from which the elapsed timestamp has to be taken from. Default from the associated sensor above">\
                        </div>\
                        <div class="form-group">\
                            <label>Icon from a sensor</label>\
                            <input type="text" id="'+id+'_control_icon_sensor" class="form-control" placeholder="the sensor from which the icon has to be taken from. Default is the static icon above">\
                        </div>\
                        <div class="form-group">\
                            <label>Widget Style</label>\
                            <input type="text" id="'+id+'_control_variant" class="form-control" placeholder="1 (default) for small box, 2 for larger box">\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_input_content" role="tabpanel" aria-labelledby="'+id+'_tab_input">\
                        <div class="form-group">\
                            <label>Sensor*</label>\
                            <input type="text" id="'+id+'_input_sensor" class="form-control" placeholder="the sensor where the input is stored" required>\
                        </div>\
                        <div class="form-group">\
                            <label>Icon</label>\
                            <select id="'+id+'_input_icon" class="form-control"></select>\
                        </div>\
                        <div class="form-group">\
                            <label>Color of the icon</label>\
                            <select id="'+id+'_input_color" class="form-control">\
                                <option value=""></option>\
                                <option value="black">black</option>\
                                <option value="gray">gray</option>\
                                <option value="silver">silver</option>\
                                <option value="white">white</option>\
                                <option value="aqua">aqua</option>\
                                <option value="blue">blue</option>\
                                <option value="navy">navy</option>\
                                <option value="teal">teal</option>\
                                <option value="green">green</option>\
                                <option value="olive">olive</option>\
                                <option value="lime">lime</option>\
                                <option value="yellow">yellow</option>\
                                <option value="orange">orange</option>\
                                <option value="red">red</option>\
                                <option value="fuchsia">fuchsia</option>\
                                <option value="purple">purple</option>\
                                <option value="maroon">maroon</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Elapsed from a different sensor</label>\
                            <input type="text" id="'+id+'_input_timestamp_sensor" class="form-control" placeholder="the sensor from which the elapsed timestamp has to be taken from. Default from the associated sensor above">\
                        </div>\
                        <div class="form-group">\
                            <label>Icon from a sensor</label>\
                            <input type="text" id="'+id+'_input_icon_sensor" class="form-control" placeholder="the sensor from which the icon has to be taken from. Default is the static icon above">\
                        </div>\
                        <div class="form-group">\
                            <label>Widget Style</label>\
                            <input type="text" id="'+id+'_input_variant" class="form-control" placeholder="1 (default) for small box, 2 for larger box">\
                        </div>\
                        <div class="form-group">\
                            <label>Allowed Values</label>\
                            <input type="text" id="'+id+'_input_allowed_values" class="form-control" placeholder="e.g. ON,OFF">\
                        </div>\
                        <div class="form-group">\
                            <label>Allowed Range</label>\
                            <input type="text" id="'+id+'_input_allowed_range" class="form-control" placeholder="e.g. 10-30">\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_button_content" role="tabpanel" aria-labelledby="'+id+'_tab_button">\
                        <div class="form-group">\
                            <label>Text*</label>\
                            <input type="text" id="'+id+'_button_text" class="form-control" placeholder="the text of the button" required>\
                        </div>\
                        <div class="form-group">\
                            <label>Actions to Execute*</label>\
                            <div id="'+id+'_button_actions"></div>\
                            <br>\
                            <div class="form-group">\
                                <button type="button" class="btn btn-default float-right" id="'+id+'_button_actions_add"><i class="fas fa-plus"></i> Add Action</button>\
                            </div>\
                        </div>\
                        <div class="form-group">\
                            <label>Icon</label>\
                            <select id="'+id+'_button_icon" class="form-control"></select>\
                        </div>\
                        <div class="form-group">\
                            <label>Color of the icon</label>\
                            <select id="'+id+'_button_color" class="form-control">\
                                <option value=""></option>\
                                <option value="black">black</option>\
                                <option value="gray">gray</option>\
                                <option value="silver">silver</option>\
                                <option value="white">white</option>\
                                <option value="aqua">aqua</option>\
                                <option value="blue">blue</option>\
                                <option value="navy">navy</option>\
                                <option value="teal">teal</option>\
                                <option value="green">green</option>\
                                <option value="olive">olive</option>\
                                <option value="lime">lime</option>\
                                <option value="yellow">yellow</option>\
                                <option value="orange">orange</option>\
                                <option value="red">red</option>\
                                <option value="fuchsia">fuchsia</option>\
                                <option value="purple">purple</option>\
                                <option value="maroon">maroon</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Icon from a sensor</label>\
                            <input type="text" id="'+id+'_button_icon_sensor" class="form-control" placeholder="the sensor from which the icon has to be taken from. Default is the static icon above">\
                        </div>\
                        <div class="form-group">\
                            <label>Widget Style</label>\
                            <input type="text" id="'+id+'_button_variant" class="form-control" placeholder="1 (default) for small box, 2 for larger box">\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_calendar_content" role="tabpanel" aria-labelledby="'+id+'_tab_calendar">\
                        <div class="form-group">\
                            <label>Sensor*</label>\
                            <input type="text" id="'+id+'_calendar_sensor" class="form-control" placeholder="the sensor whose calendar has to be displayed" required>\
                        </div>\
                        <div class="form-group">\
                            <label>Event Time Step (Minutes)</label>\
                            <input type="text" id="'+id+'_calendar_time_step" class="form-control" placeholder="minimum configurable time step for an event. Default to 15 minutes">\
                        </div>\
                        <div class="form-group">\
                            <label>Event Default Value</label>\
                            <input type="text" id="'+id+'_calendar_default_value" class="form-control" placeholder="default value when creating a new event">\
                        </div>\
                        <div class="form-group">\
                            <label>Display Event Template</label>\
                            <input type="text" id="'+id+'_calendar_event_template" class="form-control" placeholder="how to display the calendar\'s value with the %value% placeholder replaced with the actual value">\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_image_content" role="tabpanel" aria-labelledby="'+id+'_tab_image">\
                        <div class="form-group">\
                            <label>Sensor*</label>\
                            <input type="text" id="'+id+'_image_sensor" class="form-control" placeholder="the sensor whose image has to be displayed" required>\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_map_content" role="tabpanel" aria-labelledby="'+id+'_tab_map">\
                        <div class="form-group">\
                            <label>Sensors with Positions*</label>\
                            <div id="'+id+'_map_sensors"></div>\
                            <br>\
                            <div class="form-group">\
                                <button type="button" class="btn btn-default float-right" id="'+id+'_map_sensors_add"><i class="fas fa-plus"></i> Add Sensor</button>\
                            </div>\
                        </div>\
                        <div class="form-group">\
                            <label>Map Type</label>\
                            <select id="'+id+'_map_map_type" class="form-control">\
                                <option value=""></option>\
                                <option value="roadmap">displays the default road map view</option>\
                                <option value="satellite">displays satellite images</option>\
                                <option value="hybrid">displays a mixture of normal and satellite views</option>\
                                <option value="terrain">displays a physical map based on terrain information</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Timeframe to display in days</label>\
                            <input type="text" id="'+id+'_map_timeframe" class="form-control" placeholder="display positions for this number of past days (default 7 days)">\
                        </div>\
                        <div class="form-group">\
                            <label>Track movements with a line among positions</label>\
                            <input type="checkbox" class="form-control" id="'+id+'_map_tracking">\
                        </div><br>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_text_content" role="tabpanel" aria-labelledby="'+id+'_tab_text">\
                        <div class="form-group">\
                            <label>Sensor</label>\
                            <input type="text" id="'+id+'_text_sensor" class="form-control" placeholder="the sensor whose text has to be displayed">\
                        </div>\
                        <div class="form-group">\
                            <label>Static Text</label>\
                            <input type="text" id="'+id+'_text_text" class="form-control" placeholder="static text to be displayed. HTML allowed">\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_table_content" role="tabpanel" aria-labelledby="'+id+'_tab_table">\
                        <div class="form-group">\
                            <label>Associated Sensor</label>\
                            <input type="text" id="'+id+'_table_sensor" class="form-control" placeholder="the sensor whose text has to be displayed as a table (one row per line)" required>\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_counter_content" role="tabpanel" aria-labelledby="'+id+'_tab_counter">\
                        <div class="form-group">\
                            <label>Associated Sensor*</label>\
                            <input type="text" id="'+id+'_counter_sensor" class="form-control" placeholder="the sensor for which counting the values" required>\
                        </div>\
                        <div class="form-group">\
                            <label>Icon</label>\
                            <select id="'+id+'_counter_icon" class="form-control"></select>\
                        </div>\
                        <div class="form-group">\
                            <label>Color of the box</label>\
                            <select id="'+id+'_counter_color" class="form-control">\
                                <option value=""></option>\
                                <option value="black">black</option>\
                                <option value="gray">gray</option>\
                                <option value="silver">silver</option>\
                                <option value="white">white</option>\
                                <option value="aqua">aqua</option>\
                                <option value="blue">blue</option>\
                                <option value="navy">navy</option>\
                                <option value="teal">teal</option>\
                                <option value="green">green</option>\
                                <option value="olive">olive</option>\
                                <option value="lime">lime</option>\
                                <option value="yellow">yellow</option>\
                                <option value="orange">orange</option>\
                                <option value="red">red</option>\
                                <option value="fuchsia">fuchsia</option>\
                                <option value="purple">purple</option>\
                                <option value="maroon">maroon</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Timeframe</label>\
                            <input type="text" id="'+id+'_counter_timeframe" class="form-control" placeholder="timeframe to query in the format last_24_hours, default to the last 24 hours">\
                        </div>\
                        <div class="form-group">\
                            <label>Scope</label>\
                            <input type="text" id="'+id+'_counter_scope" class="form-control" placeholder="scope of the database to query, default to sensors">\
                        </div>\
                        <div class="form-group">\
                            <label>Show All Link</label>\
                            <input type="text" id="'+id+'_counter_link" class="form-control" placeholder="link for the \'Show All\' link">\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_tasks_content" role="tabpanel" aria-labelledby="'+id+'_tab_tasks">\
                        <div class="form-group">\
                            <label>Sensor*</label>\
                            <input type="text" id="'+id+'_tasks_sensor" class="form-control" placeholder="the sensor where the to-list will be saved" required>\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_logs_content" role="tabpanel" aria-labelledby="'+id+'_tab_logs">\
                        <div class="form-group">\
                            <label>Filter by Value</label>\
                            <input type="text" id="'+id+'_logs_show_only" class="form-control" placeholder="filter the table with this value" required>\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_notifications_content" role="tabpanel" aria-labelledby="'+id+'_tab_notifications">\
                        <div class="form-group">\
                            <label>Filter by Value</label>\
                            <input type="text" id="'+id+'_notifications_show_only" class="form-control" placeholder="filter the table with this value" required>\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_slider_content" role="tabpanel" aria-labelledby="'+id+'_tab_slider">\
                        <div class="form-group">\
                            <label>Sensor*</label>\
                            <input type="text" id="'+id+'_slider_sensor" class="form-control" placeholder="the sensor whose value has to be displayed" required>\
                        </div>\
                        <div class="form-group">\
                            <label>Icon</label>\
                            <select id="'+id+'_slider_icon" class="form-control"></select>\
                        </div>\
                        <div class="form-group">\
                            <label>Color of the icon</label>\
                            <select id="'+id+'_slider_color" class="form-control">\
                                <option value=""></option>\
                                <option value="black">black</option>\
                                <option value="gray">gray</option>\
                                <option value="silver">silver</option>\
                                <option value="white">white</option>\
                                <option value="aqua">aqua</option>\
                                <option value="blue">blue</option>\
                                <option value="navy">navy</option>\
                                <option value="teal">teal</option>\
                                <option value="green">green</option>\
                                <option value="olive">olive</option>\
                                <option value="lime">lime</option>\
                                <option value="yellow">yellow</option>\
                                <option value="orange">orange</option>\
                                <option value="red">red</option>\
                                <option value="fuchsia">fuchsia</option>\
                                <option value="purple">purple</option>\
                                <option value="maroon">maroon</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Widget Style</label>\
                            <input type="text" id="'+id+'_slider_variant" class="form-control" placeholder="1 (default) for small box, 2 for larger box">\
                        </div>\
                        <div class="form-group">\
                            <label>Minimum value of the slider</label>\
                            <input type="text" id="'+id+'_slider_min_value" class="form-control" placeholder="e.g. 100">\
                        </div>\
                        <div class="form-group">\
                            <label>Maximum value of the slider</label>\
                            <input type="text" id="'+id+'_slider_max_value" class="form-control" placeholder="e.g. 500">\
                        </div>\
                        <div class="form-group">\
                            <label>Step between values of the slider</label>\
                            <input type="text" id="'+id+'_slider_step" class="form-control" placeholder="e.g. 10">\
                        </div>\
                        <div class="form-group">\
                            <label>Normalize the values to a percentage</label>\
                            <input type="checkbox" class="form-control" id="'+id+'_slider_show_percentage">\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_heartbeat_content" role="tabpanel" aria-labelledby="'+id+'_tab_heartbeat">\
                        <div class="form-group">\
                            <label>Sensor*</label>\
                            <input type="text" id="'+id+'_heartbeat_sensor" class="form-control" placeholder="the sensor whose elapsed has to be displayed" required>\
                        </div>\
                        <div class="form-group">\
                            <label>Widget Style</label>\
                            <input type="text" id="'+id+'_heartbeat_variant" class="form-control" placeholder="1 (default) for small box, 2 for larger box">\
                        </div>\
                    </div>\
                    \
                    <div class="tab-pane fade" id="'+id+'_tab_permissions_content" role="tabpanel" aria-labelledby="'+id+'_tab_permissions">\
                        <div class="form-group">\
                            <label>Authorized Groups</label>\
                            <div id="'+id+'_permissions_groups"></div>\
                            <br>\
                            <div class="form-group">\
                                <button type="button" class="btn btn-default float-right" id="'+id+'_permissions_groups_add"><i class="fas fa-plus"></i> Add Group</button>\
                            </div>\
                        </div>\
                    </div>\
                    \
                </div>\
            </form>\
        ')
        // initialize select
        gui.select_icon(id+'_value_icon')
        gui.select_icon(id+'_control_icon')
        gui.select_icon(id+'_summary_icon')
        gui.select_icon(id+'_input_icon')
        gui.select_icon(id+'_button_icon')
        gui.select_icon(id+'_counter_icon')
        gui.select_icon(id+'_slider_icon')
        gui.select_icon(id+'_status_icon_on')
        gui.select_icon(id+'_status_icon_off')
        // add a link to the advanced editor
        $("#wizard_body").append('<br><a id="'+id+'_advanced_editor" class="float-right text-primary d-none">Advanced Editor</a>')
        $("#"+id+"_advanced_editor").unbind().click(function(this_class) {
            return function () {
                $('#wizard').unbind('hidden.bs.modal')
                $("#wizard").modal("hide")
                gui.unload_page()
                window.location.hash = "#__configuration="+this_class.page_id 
            };
        }(this));
        // populate the form
        var simple_types = {}
        simple_types["general"] = ["title", "size", "widget", "offset"]
        simple_types["summary"] = ["icon", "color", "icon_sensor"]
        simple_types["value"] = ["sensor", "icon", "color", "timestamp_sensor", "icon_sensor", "variant", "link", "color_success", "color_warning", "color_danger","normalize"]
        simple_types["timeline"] = ["group_by", "timeframe", "style", "series"]
        simple_types["range"] = ["sensor", "group_by", "timeframe"]
        simple_types["status"] = ["sensor", "color_on", "icon_on", "text_on", "color_off", "icon_off", "text_off", "timestamp_sensor", "variant"]
        simple_types["control"] = ["sensor", "icon", "color", "text_on", "text_off", "timestamp_sensor", "icon_sensor", "variant"]
        simple_types["input"] = ["sensor", "icon", "color", "timestamp_sensor", "icon_sensor", "variant", "allowed_values", "allowed_range"]
        simple_types["button"] = ["text", "icon", "color", "icon_sensor", "variant"]
        simple_types["calendar"] = ["sensor", "time_step", "default_value", "event_template"]
        simple_types["image"] = ["sensor"]
        simple_types["text"] = ["sensor", "text"]
        simple_types["table"] = ["sensor"]
        simple_types["counter"] = ["sensor", "icon", "color", "timeframe", "scope", "link"]
        simple_types["tasks"] = ["sensor"]
        simple_types["logs"] = ["show_only"]
        simple_types["notifications"] = ["show_only"]
        simple_types["map"] = ["map_type", "timeframe"]
        simple_types["slider"] = ["sensor", "icon", "color", "variant", "min_value", "max_value", "step"]
		simple_types["heartbeat"] = ["sensor", "variant"]
        var array_types = {}
        array_types["summary"] = ["sensors"]
        array_types["timeline"] = ["sensors"]
        array_types["control"] = ["actions"]
        array_types["button"] = ["actions"]
        array_types["map"] = ["sensors"]
        array_types["permissions"] = ["groups"]
        var checkbox_types = {}
        checkbox_types["timeline"] = ["no_range"]
        checkbox_types["map"] = ["tracking"]
        checkbox_types["slider"] = ["show_percentage"]
        // editing the widget, fill in the values
        if (widget != null) {
            // general tab elements
            for (var key of ["title", "size", "widget", "offset"]) {
                if (! (key in widget)) continue
                $("#"+id+"_general_"+key).val(widget[key])
            }
            // permission tab elements
            if ("allow" in widget) {
                for (var i = 0; i < widget["allow"].length; i++) {
                    var value = widget["allow"][i]
                    this.widget_wizard_add_array_item(id+'_permissions_groups', value)
                }
            }
            // widget-specific simple elements
            for (var type in simple_types) {
                if (widget["widget"] == type) {
                    for (var key of simple_types[type]) {
                        if (! (key in widget)) continue
                        if ($("#"+id+"_"+type+"_"+key).hasClass("bootstrap-select")) $("#"+id+"_"+type+"_"+key).selectpicker("val", widget[key])
                        else $("#"+id+"_"+type+"_"+key).val(widget[key])
                    }
                }
            }
            // widget-specific array elements
            for (var type in array_types) {
                if (widget["widget"] == type) {
                    for (var key of array_types[type]) {
                        if (! (key in widget)) continue
                        for (var i = 0; i < widget[key].length; i++) {
                            var value = widget[key][i]
                            this.widget_wizard_add_array_item(id+'_'+type+'_'+key, value)
                        }
                    }
                }
            }
            // widget-specific checkbox elements
            for (var type in checkbox_types) {
                if (widget["widget"] == type) {
                    for (var key of checkbox_types[type]) {
                        if (! (key in widget)) continue
                        $("#"+id+"_"+type+"_"+key).prop("checked", widget[key])
                    }
                }
            }
        }
        // configure permission tab
        $("#"+id+'_permissions_groups_add').unbind().click(function(this_class, id) {
            return function () {
                this_class.widget_wizard_add_array_item(id)
            };
        }(this, id+'_permissions_groups'));
        // configure add buttons
        for (var type in array_types) {
            for (var key of array_types[type]) {
                // configure add button
                $("#"+id+'_'+type+'_'+key+"_add").unbind().click(function(this_class, id) {
                    return function () {
                        this_class.widget_wizard_add_array_item(id)
                    };
                }(this, id+'_'+type+'_'+key));
            }
        }
        // configure _widget type selector
        $('#'+id+'_general_widget').unbind().change(function(this_class) {
            return function () {
                var type = $('#'+id+'_general_widget').val()
                // show up only the relevant tab
                $("#"+id+"_tabs .nav-link").each(function(e){
                    var nav_id = $(this).attr("id")
                    // always keep general
                    if (nav_id.endsWith("_general") || nav_id.endsWith("_permissions")) return
                    var is_hidden = $("#"+nav_id).parent('li').hasClass("d-none")
                    // unhide requested tab
                    if (nav_id.endsWith("_"+type)) {
                        if (is_hidden) $("#"+nav_id).parent('li').removeClass("d-none")
                    }
                    // hide all other tabs
                    else {
                        if (! is_hidden) $("#"+nav_id).parent('li').addClass("d-none")
                    }
                });
            };
        }(this))
        // refresh the widget type
        $('#'+id+'_general_widget').trigger("change")
        // configure what to do when submitting the form
        var this_class = this
        $('#'+id+'_form').on('submit', function (e) {
            // remove all hidden tabs otherwise will cause issue during validation
            $("#"+id+"_tabs .nav-link").each(function(e){
                var nav_id = $(this).attr("id")
                // always keep general
                if (nav_id.endsWith("_general") || nav_id.endsWith("_permissions")) return
                var is_hidden = $("#"+nav_id).parent('li').hasClass("d-none")
                // unhide requested tab
                if (! nav_id.endsWith("_"+type)) {
                    if (is_hidden) $("#"+nav_id+"_content").remove()
                }
            });
            // disable the widget type select since we deleted them
            $("#"+id+"_general_widget").prop("disabled", true) 
            // form is validated
            if ($('#'+id+'_form')[0].checkValidity()) {
                // build up the data structure
                var widget = {}
                // general tab elements
                for (var item of ["title", "size", "widget", "offset"]) {
                    var value = $("#"+id+"_general_"+item).val()
                    if (value == "") continue
                    widget[item] = $.isNumeric(value) ? parseFloat(value) : value
                }
                // permissions tab elements
                $("#"+id+"_permissions_groups :input[type=text]").each(function(e){
                    if (! ("allow" in widget)) widget["allow"] = []
                    widget["allow"].push(this.value)
                });
                // widget-specific simple elements
                for (var type in simple_types) {
                    if (widget["widget"] == type) {
                        for (var key of simple_types[type]) {
                            var value = $("#"+id+"_"+type+"_"+key).val()
                            if (value != "") widget[key] = $.isNumeric(value) ? parseFloat(value) : value
                        }
                    }
                }
                // widget-specific array elements
                for (var type in array_types) {
                    if (widget["widget"] == type) {
                        for (var key of array_types[type]) {
                            $("#"+id+"_"+type+"_"+key+" :input[type=text]").each(function(e){
                                if (! (key in widget)) widget[key] = []
                                widget[key].push(this.value)
                            });
                        }
                    }
                }
                // widget-specific checkbox elements
                for (var type in checkbox_types) {
                    if (widget["widget"] == type) {
                        for (var key of checkbox_types[type]) {
                            var value = $("#"+id+"_"+type+"_"+key).prop("checked")
                            widget[key] = value
                        }
                    }
                }
                // if a new widget we need to add a new column first
                if (is_new) {
                    var offset = "offset" in widget ? widget["offset"] : 0
                    id = this_class.add_column(row, this_class.get_random(), widget["size"], offset)
                }
                // update the widget
                this_class.add_widget(id, widget)
                // enable edit mode
                $("#"+id+" .edit_page_item").removeClass("d-none")
                $("#"+id+" .no_edit_page_item").addClass("d-none")
                // close the modal
                $("#wizard").modal("hide")
                gui.notify("info","Changes to the widget will not be persistent until the page will be saved")
                return false
            }
            else {
                e.preventDefault();
                e.stopPropagation();
            }
            $('#'+id+'_form').addClass("was-validated")
        })
        // configure submit button
        $('#wizard_save').unbind().click(function(this_class) {
            return function () {
                $("#"+id+"_form").submit()
            };
        }(this))
    }
    
    // start editing the page
    page_edit_start() {
        $(".edit_page_item").removeClass("d-none")
        $(".no_edit_page_item").addClass("d-none")
        $("#page_edit").addClass("d-none")
        $("#page_edit_done").removeClass("d-none")
    }
    
    // stop editing the page
    page_edit_end() {
        $(".edit_page_item").addClass("d-none")
        $(".no_edit_page_item").removeClass("d-none")
        $("#page_edit").removeClass("d-none")
        $("#page_edit_done").addClass("d-none")
    }
    
    // draw the page
    draw(page) {
        // clear up the page
        $("#body").empty()
        // build up the page
        if (this.page_id != null) {
            $("#page_id").val(this.page_id.replace("gui/pages/", ""))
            $("#page_id").prop("disabled", true)
        }
        $("#body").append('<div id="page" class="connected_rows"></div>');
        // configure sortable rows
        $("#page").sortable({
            placeholder: 'sort-highlight',
            connectWith: '.connected_rows',
            handle: '.sortable_row',
            tolerance: 'pointer',
            items: '.row_block',
            axis: 'y',
            distance: 0.5,
            forcePlaceholderSize: false,
            cancel: '',
            dropOnEmpty: true,
            zIndex: 999999,
        })
        // draw the page
        for (var row = 0; row < page.length; row++) {
            // add a row
            for (var section in page[row]) {
                // add a row/subtitle
                this.add_row(row, section)
                // add columns
                for (var column = 0; column < page[row][section].length; column++) {
                    var widget = page[row][section][column]
                    if ("allow" in widget && ! gui.is_authorized(widget["allow"])) continue
                    var offset = "offset" in widget ? widget["offset"] : 0
                    // add a new column
                    var id = this.add_column(row, column, widget["size"], offset)
                    // add the widget to the page
                    this.add_widget(id, widget)
                }
            }
        }
        // configure page edit button
        $("#page_edit").unbind().click(function(this_class) {
            return function () {
                this_class.page_edit_start()
            };
        }(this));
        // configure page edit cancel button
        $("#page_edit_cancel").unbind().click(function(this_class) {
            return function () {
                // restore the page layout
                this_class.page_edit_end()
                gui.load_page()
            };
        }(this));
        // configure page edit done button
        $("#page_edit_done").unbind().click(function(this_class) {
            return function () {
                // rebuild the page data structure
                var page = []
                // for each row of the page
                $("#page > div > div").each(function(e){
                    var row_id = this.id
                    var row_num = parseInt(row_id.replace("row_", ""))
                    var columns = []
                    // for each column
                    $("#page > div> #"+row_id+" > section").each(function(e){
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
                message.args = "gui/pages/"+$("#page_id").val()
                message.config_schema = gui.page_config_schema
                message.set_data(page)
                gui.send(message)
                // restore the page layout
                this_class.page_edit_end()
                gui.notify("success", "Page "+this_class.page_id+" saved successfully")
                if (! (JSON.stringify(page) === JSON.stringify(this_class.page))) {
                    gui.load_page()
                    gui.wait_for_configuration(this_class.page_id, 'Reloading page, please wait...')
                }
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
        // if editing another page, clean it up
        this.page_edit_end()
    }
    
    // close the current page
    close() {
        // close all the widget of the page
        for (var id in this.widget_objects) {
            var widget_object = this.widget_objects[id]
            if(typeof widget_object.close === 'function')
            widget_object.close()
        }
    }
    
    // create the requested widget and return it
    create_widget(id, widget) {
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
        else if (widget["widget"] == "notifications") widget_object = new Notifications(id, widget)
        else if (widget["widget"] == "chatbot") widget_object = new Chatbot(id, widget)
        else if (widget["widget"] == "slider") widget_object = new Value(id, widget)
		else if (widget["widget"] == "heartbeat") widget_object = new Value(id, widget)
        // system widgets
        else if (widget["widget"] == "__packages") widget_object = new Packages(id, widget)
        else if (widget["widget"] == "__modules") widget_object = new Modules(id, widget)
        else if (widget["widget"] == "__sensors") widget_object = new Sensors(id, widget)
        else if (widget["widget"] == "__logs") widget_object = new Logs(id, widget)
        else if (widget["widget"] == "__rules") widget_object = new Rules(id, widget)
        else if (widget["widget"] == "__configuration") widget_object = new Configuration(id, widget)
        else if (widget["widget"] == "__database") widget_object = new Database(id, widget)
        else if (widget["widget"] == "__gateway") widget_object = new Gateway(id, widget)
        else if (widget["widget"] == "__setup") widget_object = new Setup(id, widget)
        else if (widget["widget"] == "__users") widget_object = new Users(id, widget)
        else if (widget["widget"] == "__pages") widget_object = new Pages(id, widget)
        else if (widget["widget"] == "__menu_folders") widget_object = new Menu_folders(id, widget)
        else if (widget["widget"] == "__menu_items") widget_object = new Menu_items(id, widget)
        else gui.log_error("unknown widget "+JSON.stringify(widget))
        if (widget_object != null) this.widget_objects[id] = widget_object
        return widget_object
    }
    
    // add the widget to the page
    add_widget(id, widget) {
        // keep track of the widget configuration
        this.widgets[id] = widget
        // if there is already something at the position, remove it first
        if (id in this.widget_objects) {
            var widget_object = this.widget_objects[id]
            if(typeof widget_object.close === 'function')
            widget_object.close()
            delete this.widget_objects[id]
        }
        // create the requested widget
        var widget_object = this.create_widget(id, widget)
        if (widget_object != null) {
            // resize the widget if necessary
            var offset = "offset" in widget ? widget["offset"] : 0
            $("#"+id).removeClass().addClass("col-lg-"+widget["size"]).addClass("offset-md-"+offset)
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
                    var widget_object = this_class.create_widget("popup_body", widget)
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
            // configure the edit button
            $("#"+id+"_edit").unbind().click(function(this_class, id, widget) {
                return function () {
                    this_class.widget_wizard(id, widget)
                };
            }(this, id, widget));
        }
    }
}