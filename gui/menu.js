// handle the left menu

class Menu extends Widget {
    constructor(id) {
        super(id, {})
        this.sections = []
        this.entries = {}
    }
    
    // draw the widget's content
    draw() {
        this.add_configuration_listener("gui/menu/#")
        console.log(gui.listeners)
        console.log(gui.topics)
    }
    
    // close the widget
    close() {
    }
    
    // receive data and load it into the widget
    on_message(message) {
    }
    
    // refresh the menu
    refresh() {
        $("#"+this.id).empty()
        for (var section of this.sections) {
            if (section == null) continue
            if (! (section["section_id"] in this.entries)) continue
            $("#"+this.id).append('<li class="header" id="menu_section_'+section["section_id"]+'">'+section["text"].toUpperCase()+'</li>');
            var items = 0
            for (var entry of this.entries[section["section_id"]]) {
                if (entry == null) continue
                if (entry["section_id"] != section["section_id"]) continue
                // add the entry to the menu
                if (! gui.is_authorized(entry)) continue
                var page_tag = entry["page"].replaceAll("/","_")
                $("#"+this.id).append('<li id="menu_user_item_'+page_tag+'"><a href="#'+entry["page"]+'"> <i class="fas fa-'+entry["icon"]+'"></i> <span>'+capitalizeFirst(entry["text"])+'</span></a></li>');
                // open the page on click
                $("#menu_user_item_"+page_tag).click(function(page){
                    return function () {
                        // if clicking on the current page, explicitely reload it since hash will not change
                        if (location.hash.replace("#","") == page) gui.load_page(page)
                        window.scrollTo(0,0)
                        if ($("body").hasClass('sidebar-open')) $("body").removeClass('sidebar-open').removeClass('sidebar-collapse').trigger('collapsed.pushMenu')
                    }
                }(entry["page"]));
                items++
            }
            // hide the section if it has no items
            if (items == 0) $("#menu_section_"+section["section_id"]).addClass("hidden")
        }
    }
    
    // receive configuration
    on_configuration(message) {
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