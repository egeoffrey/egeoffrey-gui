// handle the left menu

class Menu extends Widget {
    constructor(id) {
        super(id, {})
        this.sections = []
        this.entries = {}
        this.persistent = true
    }
    
    // draw the widget's content
    draw() {
        // draw menu edit button
        $("#menu_edit").html('\
            <center>\
                <div class="form-group" id="menu_edit_button">\
                    <div class="btn-group">\
                        <button type="button" class="btn btn-sm btn-info">'+locale("menu.edit")+'</button>\
                        <button type="button" class="btn btn-sm btn-info dropdown-toggle" data-toggle="dropdown">\
                            <span class="caret"></span>\
                            <span class="sr-only">Toggle Dropdown</span>\
                        </button>\
                        <div class="dropdown-menu" role="menu" style="cursor: pointer;">\
                            <a class="dropdown-item" id="menu_section_new" style="color: black">'+locale("menu.new_section")+'</a>\
                            <a class="dropdown-item" id="menu_section_edit" style="color: black">'+locale("menu.edit_sections")+'</a>\
                            <div class="dropdown-divider"></div>\
                            <a class="dropdown-item" id="menu_menu_item_new" style="color: black">'+locale("menu.new_item")+'</a>\
                            <a class="dropdown-item" id="menu_menu_item_edit" style="color: black">'+locale("menu.edit_items")+'</a>\
                        </div>\
                    </div>\
                </div>\
                <button type="button" class="btn btn-sm btn-info d-none" id="menu_edit_cancel"><i class="fas fa-undo"></i> '+locale("menu.edit_cancel")+'</button>\
            </center>\
        ')
        // get the menu contents
        this.add_configuration_listener("gui/menu/#", "+")
    }
    
    // receive data and load it into the widget
    on_message(message) {
    }
    
    // what to do when start editing the menu
    menu_edit_start() {
        $("#menu_edit_button").addClass("d-none")
        $("#menu_edit_cancel").removeClass("d-none")
    }
    
    // refresh the menu
    refresh() {
        var selected = null
        // check if the user selected already a page
        if (location.hash != null) selected = location.hash.replace('#','')
        $("#"+this.id).empty()
        for (var section of this.sections) {
            if (section == null) continue
            if (! (section["section_id"] in this.entries)) continue
            var section_icon = "icon" in section ? "fas fa-"+section["icon"] : "far fa-circle"
            var section_html = '\
                <li class="nav-item has-treeview" id="menu_section_'+section["section_id"]+'_tree">\
                    <a href="#" class="nav-link" id="menu_section_'+section["section_id"]+'_name">\
                        <input type="text" value="'+section["section_id"]+'" class="d-none" id="menu_section_'+section["section_id"]+'_id">\
                        <i class="'+section_icon+'" id="menu_section_'+section["section_id"]+'_icon"></i> \
                        <span>'+section["text"].toUpperCase()+'</span>\
                        <span class="float-right-container">\
                            <i class="fa fa-angle-left float-right" id="menu_section_'+section["section_id"]+'_arrow"></i>\
                        </span>\
                    </a>\
                    <ul class="nav nav-treeview" id="menu_section_'+section["section_id"]+'">\
                    </ul>\
                </li>'
            $("#"+this.id).append(section_html)
            var items = 0
            for (var entry of this.entries[section["section_id"]]) {
                if (entry == null) continue
                if (entry["section_id"] != section["section_id"]) continue
                // add the entry to the menu
                if (! gui.is_authorized(entry)) continue
                var page_tag = entry["page"].replaceAll("/","_")
                $("#menu_section_"+section["section_id"]).append('\
                <li class="nav-item">\
                    <a class="nav-link" id="menu_user_item_'+page_tag+'" href="#'+entry["page"]+'">&nbsp;\
                        <input type="text" value="'+entry["page"]+'" class="d-none" id="menu_user_item_'+page_tag+'_id">\
                        <i class="nav-icon fas fa-'+entry["icon"]+'" id="menu_user_item_'+page_tag+'_icon"></i> '+capitalizeFirst(entry["text"])+'\
                    </a>\
                </li>');
                // open the page on click
                $("#menu_user_item_"+page_tag).unbind().click(function(page, section_id, page_tag){
                    return function () {
                        // if clicking on the current page, explicitely reload it since hash will not change
                        if (location.hash.replace("#","") == page) gui.load_page(page)
                        window.scrollTo(0,0)
                        // close active section
                        $("#menu li").removeClass("active menu-open")
                        // remove active section
                        $("#menu li a").removeClass("active")
                        if ($("#menu li a span i").hasClass("fa-angle-down")) {
                            $("#menu li a span i").removeClass("fa-angle-down")
                            $("#menu li a span i").addClass("fa-angle-left")
                        }
                        // open new section
                        $("#menu_section_"+section_id+"_tree").addClass("active menu-open")
                        // make new section as active
                        $("#menu_section_"+section_id+"_name").addClass("active")
                        // place arrow down
                        $("#menu_section_"+section_id+"_arrow").removeClass("fa-angle-left")
                        $("#menu_section_"+section_id+"_arrow").addClass("fa-angle-down")
                        // set item as active
                        $("#menu_user_item_"+page_tag).addClass("active")
                        // configure push menu
                        //if ($("body").hasClass('menu-open')) $("body").removeClass('menu-open').removeClass('menu-collapse').trigger('collapsed.pushMenu')
                    }
                }(entry["page"], section["section_id"], page_tag));
                items++
                // open up the section containing the selected menu item
                if (selected != null && selected == entry["page"]) {
                    // set section as active
                    $("#menu_section_"+section["section_id"]+"_name").addClass("active")
                    // place arrow down
                    $("#menu_section_"+section["section_id"]+"_arrow").removeClass("fa-angle-left")
                    $("#menu_section_"+section["section_id"]+"_arrow").addClass("fa-angle-down")
                    // open the section menu
                    $("#menu_section_"+section["section_id"]+"_tree").addClass("active menu-open")
                    // set item as active
                    $("#menu_user_item_"+page_tag).addClass("active")
                }
            }
            // hide the section if it has no items
            if (items == 0) $("#menu_section_"+section["section_id"]).addClass("d-none")
        }
        var this_class = this
        // configure new menu section button
        var this_class = this
        $("#menu_section_new").unbind().click(function(this_class) {
            return function () {
                this_class.menu_edit_start()
                // open up the wizard
                window.location.hash = "#__menu_section_wizard"
            };
        }(this));
        // configure menu section edit button
        $("#menu_section_edit").unbind().click(function(this_class) {
            return function () {
                this_class.menu_edit_start()
                $("#"+this_class.id+" > li > ul").each(function(e){
                    $("#"+this.id).remove()
                });
                $("#"+this_class.id+" > li > a").each(function(e){
                    var id = this.id.replace("_name", "")
                    // change the icon of each menu item
                    var section_id = $("#"+id+"_id").val()
                    $("#"+id+"_icon").removeClass().addClass("fas fa-edit")
                    // change anchor href to menu section wizard                    
                    $("#"+this.id).off()
                    $("#"+this.id).attr("href", "#__menu_section_wizard="+section_id)
                });
            };
        }(this));
        $("#menu_item_new").unbind().click(function(this_class) {
            return function () {
                this_class.menu_edit_start()
                // open up the wizard
                window.location.hash = "#__menu_item_wizard"
            };
        }(this));
        // configure menu item edit button
        $("#menu_item_edit").unbind().click(function(this_class) {
            return function () {
                this_class.menu_edit_start()
                $("#"+this_class.id+" > li > ul > li > a").each(function(e){
                    // change the icon of each menu item
                    var menu_item_id = $("#"+this.id+"_id").val()
                    $("#"+this.id+"_icon").removeClass().addClass("fas fa-edit")
                    // change anchor href to menu item wizard                    
                    $("#"+this.id).attr("href", "#__menu_item_wizard="+menu_item_id)
                });
            };
        }(this));
        // configure menu edit cancel button
        $("#menu_edit_cancel").unbind().click(function(this_class) {
            return function () {
                $("#menu_edit_button").removeClass("d-none")
                $("#menu_edit_cancel").addClass("d-none")
                this_class.refresh()
            };
        }(this));
    }
    
    // receive configuration
    on_configuration(message) {
        if (message.config_schema != gui.menu_config_schema) {
            return false
        }
        if (message.args.endsWith("_section")) {
            var section_id = message.args.replace("gui/menu/","").replace("/_section","")
            var section = message.get_data()
            section["section_id"] = section_id
            // if there is another section with the same name name, skip it
            for (var existing_section of this.sections) {
                if (existing_section == null) continue
                if (existing_section["section_id"] == section["section_id"]) return
            }
            // if there is another section in the same position, shift this ahead
            while (this.sections[section["order"]] != null) section["order"]++
            this.sections[section["order"]] = section
        }
        else {
            var split = message.args.replace("gui/menu/","").split("/")
            var section_id = split[0]
            var entry_id = split[1]
            var entry = message.get_data()
            entry["entry_id"] = entry_id
            entry["section_id"] = section_id
            // this is the first entry in the section
            if (! (section_id in this.entries)) this.entries[section_id] = []
            else {
                // if there is another entry in this section with the same name name, skip it
                for (var existing_entry of this.entries[section_id]) {
                    if (existing_entry == null) continue
                    if (existing_entry["entry_id"] == entry["entry_id"]) return
                }
                // if there is another entry in the same position, shift this ahead
                while (this.entries[section_id][entry["order"]] != null) entry["order"]++
            }
            this.entries[section_id][entry["order"]] = entry
        }
        this.refresh()
    }
}