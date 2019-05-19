// handle the left menu
class Menu {
    constructor(menu) {
        gui.log_debug("Received menu")
        // add admin items
        var admin = {
            "House Admin": [
                {
                    "Sensors": {
                        "page": "__sensors",
                        "icon": "microchip",
                        "allow": [
                            "admins"
                        ]
                    }
                },
                {
                    "Rules": {
                        "page": "__rules",
                        "icon": "brain",
                        "allow": [
                            "admins"
                        ]
                    }
                },
                {
                    "Configuration": {
                        "page": "__configuration",
                        "icon": "edit",
                        "allow": [
                            "admins"
                        ]
                    }
                }
            ],
            "myHouse Admin": [
                {
                    "Packages": {
                        "page": "__packages",
                        "icon": "cubes",
                        "allow": [
                            "admins"
                        ]
                    }
                },
                {
                    "Modules": {
                        "page": "__modules",
                        "icon": "server",
                        "allow": [
                            "admins"
                        ]
                    }
                },
                {
                    "Icons": {
                        "page": "__icons",
                        "icon": "palette",
                        "allow": [
                            "admins"
                        ]
                    }
                }
            ],
            "myHouse Inspector": [
                {
                    "Logger": {
                        "page": "__logger",
                        "icon": "align-justify",
                        "allow": [
                            "admins"
                        ]
                    }
                },
                {
                    "Database": {
                        "page": "__database",
                        "icon": "database",
                        "allow": [
                            "admins"
                        ]
                    }
                },
                {
                    "Gateway": {
                        "page": "__gateway",
                        "icon": "project-diagram",
                        "allow": [
                            "admins"
                        ]
                    }
                }
            ]
        }
        menu.push(admin)
        // empty the menu
        $("#menu").empty()
        // walk through the configured layout
        for (var i = 0; i < menu.length; i++) {
            for (var section in menu[i]) {
                $("#menu").append('<li class="header" id="menu_section_'+i+'">'+section.toUpperCase()+'</li>');
                var items = 0
                for (var j = 0; j < menu[i][section].length; j++) {
                    for (var menu_name in menu[i][section][j]) {
                        var item = menu[i][section][j][menu_name]
                        // add the item to the menu
                        if (! gui.is_authorized(item)) continue
                        var page_tag = item["page"].replaceAll("/","_")
                        $("#menu").append('<li id="menu_user_item_'+page_tag+'"><a href="#'+item["page"]+'"> <i class="fas fa-'+item["icon"]+'"></i> <span>'+capitalizeFirst(menu_name)+'</span></a></li>');
                        // open the page on click
                        $("#menu_user_item_"+page_tag).click(function(page){
                            return function () {
                                // if clicking on the current page, explicitely reload it since hash will not change
                                if (location.hash.replace("#","") == page) gui.load_page(page)
                                if ($("body").hasClass('sidebar-open')) $("body").removeClass('sidebar-open').removeClass('sidebar-collapse').trigger('collapsed.pushMenu')
                            }
                        }(item["page"]));
                        items++
                    }
                }
                // hide the section if it has no items
                if (items == 0) $("#menu_section_"+i).addClass("hidden")
            }
        }
        $("#menu_admin_item_modules").click(function(){
            if ($("body").hasClass('sidebar-open')) $("body").removeClass('sidebar-open').removeClass('sidebar-collapse').trigger('collapsed.pushMenu');
        })     
    }
}