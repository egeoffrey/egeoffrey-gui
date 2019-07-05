// configuration widget
class Configuration extends Widget {
    constructor(id, widget) {
        super(id, widget)
        // map configuration filename with tab_id
        this.tabs = {}
        // array of configuration listeners
        this.listeners = []
        // tab count
        this.tabs_count = 1
        // common prefix to all the tabs
        this.prefix = ""
        // keep track of the current configuration (array of configurations subscribed)
        this.current_configurations = []
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
        // TODO: delete configuration
    }
    
    // request data from an array of configurations
    request_data(configuration_array) {
        // empty existing contents
        $("#"+this.id+"_tab_index").empty()
        $("#"+this.id+"_tab_content").empty()
        // unsubscribe from previously subscribed topics
        for (var configuration of this.current_configurations) {
            // TODO: this will unsubscribe from topics interested by other widgets
            this.remove_configuration_listener(configuration)
        }
        this.listeners = []
        this.tabs = {}
        this.tabs_count = 1
        this.current_configurations = configuration_array
        // request configurations to display
        for (var configuration of configuration_array) {
            if (configuration.endsWith("/#")) {
                this.prefix = configuration.replace("#","")
            }
            else if (configuration.includes("/")) {
                var match = configuration.match('^(.+\/)[^\/]+$')
                this.prefix = match[1]
            }
            this.listeners.push(this.add_configuration_listener(configuration))
        }
    }
    
    // request a template 
    request_template(request) {
        // based on the selection, point out the configuration to subscribe to
        var configuration_array = []
        if (request == "house") configuration_array = ["house", "users", "groups"]
        else if (request == "controller") configuration_array = ["controller/#"]
        else if (request == "service") configuration_array = ["service/#"]
        else if (request == "interaction") configuration_array = ["interaction/#"]
        else if (request == "notification") configuration_array = ["notification/#"]
        else if (request == "sensors") configuration_array = ["sensors/#"]
        else if (request == "rules") configuration_array = ["rules/#"]
        else if (request == "gui") configuration_array = ["gui/settings", "gui/charts"]
        else if (request == "menu") configuration_array = ["gui/menu/#"]
        else if (request == "pages") configuration_array = ["gui/pages/#"]
        else return
        this.request_data(configuration_array)
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget:
        var configuration_id = null
        if (location.hash.includes("=")) {
            var request = location.hash.split("=")
            configuration_id = request[1]
        }
        var body = "#"+this.id+"_body"
        if (configuration_id == null) {
            // add new file button
            var button_html = '\
                <div class="form-group">\
                    <button type="button" id="'+this.id+'_new" class="btn btn-block btn-primary btn-lg"><i class="fas fa-plus"></i> Add a new file</button>\
                </div>'
            $(body).append(button_html)
            $("#"+this.id+"_new").unbind().click(function(this_class) {
                return function () {
                    window.location.hash = '#'+gui.settings["configuration_page"]+'='+this_class.prefix+'__new__'
                };
            }(this));
            // add selector
            var selector = '\
                <div class="form-group">\
                    <select class="form-control" id="'+this.id+'_selector">\
                        <option value="house">house</option>\
                        <option value="controller">controller</option>\
                        <option value="interaction">interaction</option>\
                        <option value="notification">notification</option>\
                        <option value="service">service</option>\
                        <option value="sensors">sensors</option>\
                        <option value="rules">rules</option>\
                        <option value="gui">gui</option>\
                        <option value="menu">menu</option>\
                        <option value="pages">pages</option>\
                    </select>\
                </div>\
            '
            $(body).append(selector)
            // configure selector action on change
            $("#"+this.id+"_selector").unbind().change(function(this_class) {
                return function () {
                    var request = $("#"+this_class.id+"_selector").val()
                    this_class.request_template(request)
                };
            }(this));
        }
        // add panel
        var panel = '\
          <div class="nav-tabs-custom">\
            <ul class="nav nav-tabs" id="'+this.id+'_tab_index">\
              <li class="pull-right"><a href="#" class="text-muted"><i class="fa fa-gear"></i></a></li>\
            </ul>\
            <div class="tab-content" id="'+this.id+'_tab_content">\
            </div>\
          </div>\
        </div>'
        $(body).append(panel)
        // select first group
        if (configuration_id == null) {
            $("#"+this.id+"_selector").val("house")
            this.request_template("house")
        // load the data of the given configuration
        } 
        else {
            if (configuration_id.endsWith("__new__")) {
                if (configuration_id.includes("/")) {
                    var match = configuration_id.match('^(.+\/)[^\/]+$')
                    this.prefix = match[1]
                }
                var message = new Message(gui)
                message.args = configuration_id
                this.on_configuration(message)
            }
            else this.request_data([configuration_id])
        }
    }
    
    // close the widget
    close() {
        // TODO: unsubscribe?
    }
    
    // receive data and load it into the widget
    on_message(message) {
    }
    
    // receive configuration
    on_configuration(message) {
        var active = this.tabs_count == 1 ? "active" : ""
        var tab_id = this.id+'_tab_'+this.tabs_count
        // configuration file already has already a tab, update the content
        if (message.args in this.tabs) {
            var tab_id = this.tabs[message.args]
            $("#"+tab_id+'_text').val(jsyaml.dump(message.get_data()))
        }
        // new configuration file, add a new tab
        else {
            this.tabs[message.args] = tab_id
            // remove the prefix (e.g. sensors/) from the title
            var tab_title = message.args.replace(this.prefix, "")
            var is_new_item = tab_title == "__new__" ? true : false
            // if this is for a new item, shows up a text input instead
            var tab_title_html = is_new_item ? '<input type=text id="'+tab_id+'_title" placeholder="give it a name"></input>' : tab_title
            // add the tab 
            var tab_index_html = '\
                <li class="'+active+'">\
                    <a href="#'+tab_id+'" data-toggle="tab">'+tab_title_html+'</a>\
                </li>'
            $("#"+this.id+"_tab_index").append(tab_index_html)
            // add the content to the tab
            var tab_content_textarea = is_new_item ? "" : jsyaml.dump(message.get_data())
            var tab_content_html = '\
                <div class="tab-pane '+active+'" id="'+tab_id+'">\
                    <div class="form-group">\
                        <textarea rows="15" class="form-control" id="'+tab_id+'_text" placeholder="type in the YAML configuration">'+tab_content_textarea+'</textarea>\
                    </div>\
                    <div class="form-group">\
                        <button type="button"  onclick="window.history.go(-1); return false;" class="btn btn-default">Back</button> \
                        <button type="button" id="'+tab_id+'_button" class="btn btn-primary">Save</button>\
                    </div>\
                </div>'
            $("#"+this.id+"_tab_content").append(tab_content_html)
            // configure the save button
            $("#"+tab_id+"_button").unbind().click(function(args, tab_id, is_new_item) {
                return function () {
                    // ask the config module to save the new configuration
                    if ($("#"+tab_id+"_title").val() == "") {
                        gui.notify("error","Invalid configuration filename")
                        return
                    }
                    var message = new Message(gui)
                    message.recipient = "controller/config"
                    message.command = "SAVE"
                    message.args = is_new_item ? args.replace("__new__", $("#"+tab_id+"_title").val()) : args
                    try {
                        var yaml = jsyaml.load($("#"+tab_id+"_text").val())
                        message.set_data(yaml)
                        gui.send(message)
                        gui.notify("success","Configuration "+message.args+" saved successfully")
                        if (location.hash.includes("=")) window.history.back()
                    } catch(e) {
                        gui.notify("error","Invalid configuration file: "+e.message)
                    }
                };
            }(message.args, tab_id, is_new_item))
            // increment tab counter
            this.tabs_count++
        }
    }
}