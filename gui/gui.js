

class Gui extends Module {
    // What to do when initializing
    on_init() {
        this.username = "MYHOUSE_USERNAME" in window ? window.MYHOUSE_USERNAME : "guest"
        this.password = "MYHOUSE_PASSWORD" in window ? window.MYHOUSE_PASSWORD : ""
        // map a subscribed topic with an array of widgets
        this.listeners = {}
        // map a requested configuration with its content (since a retained message, we need to keep track)
        this.configurations = {}
        // map a manifest with its content (since a retained message, we need to keep track)
        this.manifests = {}
        // map request_id with an array of the requesting widgets
        this.requests = {}
        // other settings
        this.house = {}
        this.settings = {}
        this.charts = {}
        this.users = {}
        this.groups = {}
        // date/time helper
        this.date = null
        // subscribe to required settings
        this.page_config_schema = 1
        this.chart_config_schema = 1
        this.settings_config_schema = 1
        this.menu_config_schema = 1
        this.add_configuration_listener("house", 1, true)
        this.add_configuration_listener("gui/settings", "+", true)
        this.add_configuration_listener("gui/charts", "+", true)
        this.add_configuration_listener("users", 1, true)
        this.add_configuration_listener("groups", 1, true)
        this.supported_sensors_config_schema = 1
        this.supported_rules_config_schema = 1
        this.supported_manifest_schema = 2
        // objects of the current page
        this.page = null
        this.page_listener = null
        this.menu = new Menu("menu")
        this.toolbar = new Toolbar("toolbar")
        // set to true when waiting for a page
        this.waiting_for_page = false
        // loaded Google Maps
        this.maps_loaded = false
        // scheduler's events
        this.scheduler_events = []
        // check for updates after login
        this.check_for_updates = true
        // safeguard, if not receiving a configuration file timely, disconnect
        setTimeout(function(this_class) {
            return function() {
                if (Object.keys(this_class.settings).length === 0) {
                    this_class.log_error("Timeout in receiving the configuration, disconnecting")
                    this_class.join()
                }
            };
        }(this), 2000);
    }
    
	// notify the user about something
	notify(type, message) {
		var options = {
			message: message,
		}
		var settings = {
			type: type,
		}
		$.notify(options, settings);
	}
    
	// ask the user confirmation about something
	confirm(message, func) {
        bootbox.confirm({
            "message": message,
            "buttons": {
                "cancel": {
                    "label": '<i class="fas fa-times"></i> Cancel'
                },
                "confirm": {
                    "label": '<i class="fas fa-check"></i> Confirm'
                }
            },
            "callback": func
        });
	}
    
    // set the sking to the GUI
    load_skin(skin) {
        var skins = [
            "skin-blue",
            "skin-black",
            "skin-red",
            "skin-yellow",
            "skin-purple",
            "skin-green",
            "skin-blue-light",
            "skin-black-light",
            "skin-red-light",
            "skin-yellow-light",
            "skin-purple-light",
            "skin-green-light"
        ];
        if (! (skins.includes("skin-"+skin))) return
        // remove all the skins from the body first
        $.each(skins, function (i) {
            $("body").removeClass(skins[i]);
        });
        // apply the new skin
        $("body").addClass("skin-"+skin);
    }
    
    unload_page() {
        // clear all previously cached settings
        this.requests = {}
        // unsubscribe from all previously subscribed objects
        for (var topic in this.listeners) {
            // rebuild the array of registered widgets
            var new_listener = []
            for (var widget of this.listeners[topic]) {
                // keep only persistent widgets
                if (widget.persistent) new_listener.push(widget)
            }
            this.listeners[topic] = new_listener
            // if there are no more widgets listening for that topic, remove the listener
            if (this.listeners[topic].length == 0) {
                // TODO: do not remove mandatory topics
                this.remove_listener(topic)
                delete this.listeners[topic]
            }
        }
        // close the old page
        if (this.page != null) this.page.close()
    }
    
    load_page() {
        this.unload_page()
        // load the page
        window.scrollTo(0,0)
        var page_id = location.hash.replace('#','')
        // remove arguments from the page_id
        if (page_id.includes("=")) {
            var split = page_id.split("=")
            page_id = split[0]
        }
        // if no page is provided, load the default_page
        if (page_id == "") page_id = gui.settings["default_page"]
        // load system pages
        if (page_id.startsWith("__")) {
            this.page = new Page("SYSTEM", page_id)
        }
        // load user's page
        else {
            this.waiting_for_page = true
            if (this.page_listener != null) this.remove_listener(this.page_listener)
            this.page_listener = this.add_configuration_listener("gui/pages/"+page_id, "+")
        }
    }

    // What to do just after connecting
    on_connect() {
        $("#status").html('<i class="fas fa-circle text-success"></i>Connected</span>');
        $("#status").unbind().click(function(this_class) {
            return function () {
                // clear stored credentials
                localStorage.clear()
                // disconnect
                this_class.join()
            };
        }(this));
    }
    
    // return true if the current user is authorized to access the item, false otherwise
    is_authorized(item) {
        // check if a restriction  is in place
        if ("allow" in item) {
            // for each authorized group, check if the current user belong to one of them
            for (var group of item["allow"]) {
                if (! (group in this.groups)) continue
                if (this.groups[group].includes(this.username)) return true
            }
            return false
        }
        else return true
    }
    
    // check if the user is authenticated
    is_authenticated() {
        // authenticate the user
        if (! (this.username in this.users)) this.join()
        var user = this.users[this.username]
        if (user["password"] != this.password) this.join()
        $("#user_icon").addClass("fa-"+user["icon"])
        $("#user_fullname").html(user["fullname"])
    }
    
    // What to do after starting
    on_start() {
        // ensure the user is authenticated
        this.is_authenticated()
        // if a page is requested, load it
        this.load_page()
        // whenever the hash changes, load the requested page
        window.onhashchange = function() {
            gui.load_page()
        }
        this.menu.draw()
        this.toolbar.draw()
    }
        
    // What to do when exiting
    on_stop() {
        var user = this.users[this.username]
        if (user != null) $("#user_icon").removeClass("fa-"+user["icon"])
    }
    
    // What to do when disconnecting
    on_disconnect() {
        $("#body").empty()
        $("#user_fullname").html("");
        $("#status").html("");
    }
  
    // What to do when receiving a request for this module
    on_message(message) {
        var delivered = 0
        // dispatch the message to the requesting widget if there is an associated request_id
        var request_id = message.get_request_id()
        if (request_id in this.requests) {
            var widget = this.requests[request_id]
            widget.on_message(message)
            delete this.requests[request_id]
            delivered++
        }
        // deliver the message to any widget waiting for a message on that topic
        if (delivered == 0) {
            for (var topic in this.listeners) {
                // deliver the message to all the listeners
                if (topic_matches_sub(topic, message.topic)) {
                    for (var widget of this.listeners[topic]) {
                        widget.on_message(message)
                        delivered++
                    }
                }
            }
        }
        // keep track of received manifest files
        if (message.command == "MANIFEST") this.manifests[message.args] = message
        if (delivered == 0) this.log_debug("undelivered message: "+message.dump())
    }
    
    // What to do when receiving a new/updated configuration for this module
    on_configuration(message) {
        // TODO: how to handle sensors/pages/menu removed from config
        if (message.is_null) return
        // load the page
        else if (this.waiting_for_page && message.args.startsWith("gui/pages/")) {
            if (message.config_schema != this.page_config_schema) {
                return false
            }
            this.log_debug("Received "+message.args)
            this.page = new Page("USER", message.get_data())
            this.waiting_for_page = false
        }
        // load charts
        else if (message.args == "gui/charts") {
            if (message.config_schema != this.chart_config_schema) {
                return false
            }
            for (var chart_name in message.get_data()) {
                var chart = message.get(chart_name)
                // if a template is defined, merge the template configuration with the chart configuration
                if ("template" in chart) {
                    this.charts[chart_name] = Object.assign({}, this.charts[chart["template"]], chart)
                }
                else this.charts[chart_name] = chart
            }
        }
        else if (message.args == "house") {
            if (! this.is_valid_configuration(["units", "timezone", "language", "name"], message.get_data())) return false
            this.house = message.get_data()
            // set house name
            $("#house_name").html(this.house["name"].replaceAll(" ","&nbsp;"))
            // set house time
            this.date = new DateTimeUtils(message.get("timezone"))
            $("#house_time").html(gui.date.format_timestamp())
            setInterval(function() {
                if (gui.date != null) $("#house_time").html(gui.date.format_timestamp())
            }, 1000);
            this.load_skin(message.get("skin"))
            
        }
        else if (message.args == "gui/settings") {
            if (message.config_schema != this.settings_config_schema) {
                return false
            }
            if (! this.is_valid_configuration(["skin", "map", "default_page"], message.get_data())) return false
            this.settings = message.get_data()
            this.load_skin(message.get("skin"))
        }
        else if (message.args == "users") {
            this.users = message.get_data()
            // ensure the user is still authenticated
            this.is_authenticated()
        }
        else if (message.args == "groups") {
            this.groups = message.get_data()
        }
        this.log_debug("Received configuration "+message.args)
        // keep track of the configuration file
        this.configurations[message.args] = message
        // deliver the configuration to any widget waiting for it
        for (var topic in this.listeners) {
            // deliver the message to all the listeners
            if (topic_matches_sub(topic, message.topic)) {
                for (var widget of this.listeners[topic]) {
                    widget.on_configuration(message)
                }
            }
        }
    }
}
