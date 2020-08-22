// handle the left menu

class Menu extends Widget {
    constructor(id) {
        super(id, {})
        this.folders = []
        this.entries = {}
        this.persistent = true
    }
    
    // draw the widget's content
    draw() {
        // add system entries on top
        this.folders[0] = { text: "Welcome", order: 0, section_id: "__welcome", icon: "concierge-bell"}
        this.entries["__welcome"] = []
        this.entries["__welcome"].push({section_id: "__welcome",  order: 0, entry_id: "__welcome", text: "Getting Started", icon: "book-open", page: "__welcome"})
        this.entries["__welcome"].push({section_id: "__welcome",  order: 1, entry_id: "__chatbot", text: "Chatbot", icon: "robot", page: "__chatbot"})
        this.entries["__welcome"].push({section_id: "__welcome",  order: 2, entry_id: "__notifications", text: "Notifications", icon: "comments", page: "__notifications"})
        this.entries["__welcome"].push({section_id: "__welcome",  order: 3, entry_id: "__measures", text: "Feed", icon: "exchange-alt", page: "__measures"})
        this.folders[1] = { header: "MY HOUSE"}
        // get the menu contents
        this.add_configuration_listener("gui/menu/#", gui.menu_config_schema)
    }
    
    // receive data and load it into the widget
    on_message(message) {
    }
    
    // add a menu item to the menu
    add_menu_item(entry, add_to_folder=true) {
        var selected = null
        // check if the user selected already a page
        if (location.hash != null) selected = location.hash.replace('#','')
        // add the entry
        var page_tag = entry["page"].replaceAll("/","_")
        var tag = add_to_folder ? "#menu_section_"+entry["section_id"] : "#"+this.id
        var href = "url" in entry ? entry["url"] : "#"+entry["page"]
        var target = "url" in entry ? "target=_blank" : ""
        $(tag).append('\
        <li class="nav-item">\
            <a class="nav-link" id="menu_user_item_'+page_tag+'" href="'+href+'" '+target+'>&nbsp;\
                <input type="text" value="'+entry["section_id"]+'/'+entry["entry_id"]+'" class="d-none" id="menu_user_item_'+page_tag+'_id">\
                <i class="nav-icon fas fa-'+entry["icon"]+'" id="menu_user_item_'+page_tag+'_icon"></i>\
                <p>'+capitalizeFirst(entry["text"])+'</p>\
            </a>\
        </li>');
        // open the page on click
        if (! ("url" in entry)) {
            $("#menu_user_item_"+page_tag).unbind().click(function(page, folder_id, page_tag){
                return function () {
                    // if clicking on the current page, explicitly reload it since hash will not change
                    if (location.hash.replace("#","") == page) gui.load_page(page)
                    window.scrollTo(0,0)
                    // close active folder
                    $("#menu li").removeClass("active menu-open")
                    // remove active folder
                    $("#menu li a").removeClass("active")
                    // open new folder
                    $("#menu_section_"+folder_id+"_tree").addClass("active menu-open")
                    // make new section as active
                    $("#menu_section_"+folder_id+"_name").addClass("active")
                    // set item as active
                    $("#menu_user_item_"+page_tag).addClass("active")
                    // collapse the sidebar if open on mobile
                    if ($("body").hasClass('sidebar-open')) $("body").removeClass('sidebar-open').removeClass('sidebar-collapse').trigger('collapsed.pushMenu');
                }
            }(entry["page"], entry["section_id"], page_tag));
        }
        // open up the folder containing the selected menu item
        if (selected != null && selected == entry["page"]) {
            // set folder as active
            $("#menu_section_"+entry["section_id"]+"_name").addClass("active")
            // open the section menu
            $("#menu_section_"+entry["section_id"]+"_tree").addClass("active menu-open")
            // set item as active
            $("#menu_user_item_"+page_tag).addClass("active")
        }
    }
    
    // refresh the menu
    refresh() {
        $("#"+this.id).empty()
        // clone folders and entries objects
        var folders = this.folders.slice()
        var entries = jQuery.extend({ }, this.entries)
        // add admin entries at the end
        if (gui.is_authorized(["house_admins"]) || gui.is_authorized(["egeoffrey_admins"])) folders[folders.length] = { header: "ADMINISTRATION"}
        if (gui.is_authorized(["house_admins"])) {
            folders[folders.length+1] = { text: "House", order: folders.length+1, section_id: "__house_admin", icon: "user-shield"}
            entries["__house_admin"] = []
            entries["__house_admin"].push({section_id: "__house_admin",  order: 0, entry_id: "setup", text: "Setup", icon: "home", page: "__setup"})
            entries["__house_admin"].push({section_id: "__house_admin",  order: 1, entry_id: "sensors", text: "Sensors", icon: "microchip", page: "__sensors"})
            entries["__house_admin"].push({section_id: "__house_admin",  order: 2, entry_id: "rules", text: "Rules", icon: "cogs", page: "__rules"})
            entries["__house_admin"].push({section_id: "__house_admin",  order: 3, entry_id: "pages", text: "Pages", icon: "columns", page: "__pages"})
            entries["__house_admin"].push({section_id: "__house_admin",  order: 4, entry_id: "menu", text: "Menu", icon: "compass", page: "__menu"})
            entries["__house_admin"].push({section_id: "__house_admin",  order: 5, entry_id: "users", text: "Users", icon: "users", page: "__users"})
        }
        if (gui.is_authorized(["egeoffrey_admins"])) {
            folders[folders.length+2] = { text: "eGeoffrey", order: folders.length+2, section_id: "__egeoffrey_admin", icon: "toolbox"}
            entries["__egeoffrey_admin"] = []
            entries["__egeoffrey_admin"].push({section_id: "__egeoffrey_admin",  order: 0, entry_id: "packages", text: "Packages", icon: "cubes", page: "__packages"})
            entries["__egeoffrey_admin"].push({section_id: "__egeoffrey_admin",  order: 1, entry_id: "modules", text: "Modules", icon: "server", page: "__modules"})
            entries["__egeoffrey_admin"].push({section_id: "__egeoffrey_admin",  order: 2, entry_id: "marketplace", text: "Marketplace", icon: "shopping-cart", page: "__marketplace", url: "https://marketplace.egeoffrey.com"})
            entries["__egeoffrey_admin"].push({section_id: "__egeoffrey_admin",  order: 3, entry_id: "logs", text: "Logs", icon: "align-justify", page: "__logs"})
            entries["__egeoffrey_admin"].push({section_id: "__egeoffrey_admin",  order: 4, entry_id: "database", text: "Database", icon: "database", page: "__database"})
            entries["__egeoffrey_admin"].push({section_id: "__egeoffrey_admin",  order: 5, entry_id: "gateway", text: "Gateway", icon: "project-diagram", page: "__gateway"})
            entries["__egeoffrey_admin"].push({section_id: "__egeoffrey_admin",  order: 6, entry_id: "configuration", text: "Advanced Editor", icon: "edit", page: "__configuration"})
        }
        if (gui.is_authorized(["house_admins"]) || gui.is_authorized(["egeoffrey_admins"])) {
            folders[folders.length+3] = { text: "Help", order: folders.length+3, section_id: "__help", icon: "question-circle"}
            entries["__help"] = []
            entries["__help"].push({section_id: "__help",  order: 0, entry_id: "__docs", text: "Docs", icon: "book-open", url: "https://docs.egeoffrey.com", page: "__docs"})
            entries["__help"].push({section_id: "__help",  order: 0, entry_id: "__forum", text: "Forum", icon: "comments", url: "https://forum.egeoffrey.com", page: "__forum"})
            entries["__help"].push({section_id: "__help",  order: 0, entry_id: "__developer", text: "Developers", icon: "code", url: "https://developer.egeoffrey.com", page: "__developer"})
        }
        // draw the menu
        for (var folder of folders) {
            if (folder == null) continue
            // this is just a header
            if ("header" in folder) {
                $("#"+this.id).append('<li class="nav-header">'+folder["header"]+'</li>')
                continue
            }
            if (! (folder["section_id"] in entries)) continue
            // add the folder
            var folder_icon = "icon" in folder ? "fas fa-"+folder["icon"] : "far fa-circle"
            var folder_html = '\
                <li class="nav-item has-treeview" id="menu_section_'+folder["section_id"]+'_tree">\
                    <a href="#" class="nav-link" id="menu_section_'+folder["section_id"]+'_name">\
                        <input type="text" value="'+folder["section_id"]+'" class="d-none" id="menu_section_'+folder["section_id"]+'_id">\
                        <i class="'+folder_icon+' nav-icon" id="menu_section_'+folder["section_id"]+'_icon"></i> \
                        <p>\
                            '+folder["text"]+'\
                            <i class="fa fa-angle-left right" id="menu_section_'+folder["section_id"]+'_arrow"></i>\
                        </p>\
                    </a>\
                    <ul class="nav nav-treeview" id="menu_section_'+folder["section_id"]+'">\
                    </ul>\
                </li>'
            $("#"+this.id).append(folder_html)
            // add the entries to the folder
            var items = 0
            for (var entry of entries[folder["section_id"]]) {
                if (entry == null) continue
                if (entry["section_id"] != folder["section_id"]) continue
                // add the entry to the menu
                if ("allow" in entry && ! gui.is_authorized(entry["allow"])) continue
                this.add_menu_item(entry)
                items++
            }
            // hide the folder if it has no items
            if (items == 0) $("#menu_section_"+entry["section_id"]).addClass("d-none")
        }
    }
    
    // receive configuration
    on_configuration(message) {
        if (message.config_schema != gui.menu_config_schema) {
            return false
        }
        if (message.args.endsWith("_section")) {
            var folder_id = message.args.replace("gui/menu/","").replace("/_section","")
            var folder = message.get_data()
            folder["section_id"] = folder_id
            // if there is another folder with the same name name, skip it
            for (var existing_folder of this.folders) {
                if (existing_folder == null) continue
                if (existing_folder["section_id"] == folder["section_id"]) return
            }
            // if there is another folder in the same position, shift this ahead
            while (this.folders[folder["order"]] != null) folder["order"]++
            this.folders[folder["order"]] = folder
        }
        else {
            var split = message.args.replace("gui/menu/","").split("/")
            var folder_id = split[0]
            var entry_id = split[1]
            var entry = message.get_data()
            entry["entry_id"] = entry_id
            entry["section_id"] = folder_id
            // this is the first entry in the folder
            if (! (folder_id in this.entries)) this.entries[folder_id] = []
            else {
                // if there is another entry in this folder with the same name name, skip it
                for (var existing_entry of this.entries[folder_id]) {
                    if (existing_entry == null) continue
                    if (existing_entry["entry_id"] == entry["entry_id"]) return
                }
                // if there is another entry in the same position, shift this ahead
                while (this.entries[folder_id][entry["order"]] != null) entry["order"]++
            }
            this.entries[folder_id][entry["order"]] = entry
        }
        this.refresh()
    }
}