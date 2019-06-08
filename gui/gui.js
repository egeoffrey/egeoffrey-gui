

class Gui extends Module {
    // What to do when initializing
    on_init() {
        this.username = "MYHOUSE_USERNAME" in window ? window.MYHOUSE_USERNAME : "guest"
        this.password = "MYHOUSE_PASSWORD" in window ? window.MYHOUSE_PASSWORD : ""
        // array of all the topics subscribed
        this.topics = []
        // map a subscribed topic with an array of widgets
        this.listeners = {}
        // map a requested configuration with its content
        this.configurations = {}
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
        // set to true when waiting for a page
        this.waiting_for_page = false
        // subscribe to required settings
        this.add_configuration_listener("house", true)
        this.add_configuration_listener("gui/settings", true)
        this.add_configuration_listener("gui/charts", true)
        this.add_configuration_listener("users", true)
        this.add_configuration_listener("groups", true)
        this.page = null
        this.menu = new Menu("menu")
        // safeguard, if not receiving a configuration file timeline, disconnect
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
		var title = null
		if (type == "danger") title = "Error"
		else if (type == "warning") title = "Warning"
		if (title != null) options["title"] = "<strong>"+title+":</strong> "
		$.notify(options, settings);
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
    
    load_page() {
        // clear all previously cached settings
        //this.configurations = {}
        this.requests = {}
        this.listeners = {}
        // unsubscribe from all previously subscribed objects
        for (var topic of this.topics) {
            if (topic != null) this.remove_listener(topic)
        }
        this.topics = []
        // load the page
        var page_id = location.hash.replace('#','')
        // close the old page
        if (this.page != null) this.page.close()
        // load system pages
        if (page_id.startsWith("__")) {
            this.page = new Page("SYSTEM", page_id)
        }
        // load user's page
        else {
            this.waiting_for_page = true
            this.topics.push(this.add_configuration_listener("gui/pages/"+page_id))
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
        if (location.hash) this.load_page()
        // whenever the hash changes, load the requested page
        window.onhashchange = function() {
            if (location.hash) gui.load_page()
        }
        this.menu.draw()
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
                if (topic_matches_sub(topic, message.command+"/"+message.args)) {
                    for (var widget of this.listeners[topic]) {
                        widget.on_message(message)
                        delivered++
                    }
                }
            }
        }
        if (delivered == 0) this.log_debug("undelivered message: "+message.dump())
    }
    
    // What to do when receiving a new/updated configuration for this module
    on_configuration(message) {
        // TODO: how to handle sensors removed from config
        if (message.is_null) return
        // load the page
        else if (this.waiting_for_page && message.args.startsWith("gui/pages/")) {
            this.log_debug("Received "+message.args)
            this.page = new Page("USER", message.get_data())
            this.waiting_for_page = false
        }
        // load charts
        else if (message.args == "gui/charts") {
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
            if (! this.is_valid_module_configuration(["units", "timezone", "language", "name"], message.get_data())) return false
            this.house = message.get_data()
            // set house name
            $("#house_name").html(this.house["name"].replaceAll(" ","&nbsp;"))
            // set house time
            this.date = new DateTimeUtils(message.get("timezone"))
            $("#house_time").html(gui.date.format_timestamp())
            setInterval(function() {
                $("#house_time").html(gui.date.format_timestamp())
            }, 1000);
            this.load_skin(message.get("skin"))
            
        }
        else if (message.args == "gui/settings") {
            if (! this.is_valid_module_configuration(["skin", "map"], message.get_data())) return false
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
        this.configurations[message.args] = message.get_data()
        // deliver the configuration to any widget waiting for it
        for (var topic in this.listeners) {
            if (topic_matches_sub(topic, message.args)) {
                for (var widget of this.listeners[topic]) {
                    widget.on_configuration(message)
                }
            }
        }
    }
}
