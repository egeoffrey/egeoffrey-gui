// marketplace widget
class Marketplace extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.marketplace_url = "https://api.github.com/repos/myhouse-project/myhouse-marketplace/contents/marketplace"
        this.marketplace_branch = "master"
        this.manifests = []
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // load the marketplace
    load_marketplace() {
        $("#"+this.id+"_marketplace").empty()
        var this_class = this
        // list marketplace entries
        $.get(this.marketplace_url, function(content) {
            gui.log_debug("Marketplace has "+content.length+" entries")
            // for each package in the parketplace
            for (var entry of content) {
                if (! ("path" in entry) || ! ("name" in entry)) continue
                var package_name = entry["name"].replace(".yml", "")
                // download the marketplace item
                $.get("https://raw.githubusercontent.com/myhouse-project/myhouse-marketplace/"+this_class.marketplace_branch+"/marketplace/"+package_name+".yml?timestamp="+(new Date()).getTime(), function(data) {
                    try {
                        var yaml = jsyaml.load(data)
                    } catch(e) {
                        gui.log_warning("Invalid marketplace file for package "+package_name+": "+e.message)
                        return
                    }
                    if (! ("github" in yaml)) {
                        gui.log_warning("Invalid marketplace file for package "+package_name+": "+e.message)
                        return
                    }
                    var branch = "development"
                    // download the manifest of the package
                    $.get("https://raw.githubusercontent.com/"+yaml["github"]+"/"+branch+"/manifest.yml?timestamp="+(new Date()).getTime(), function(data) {
                        try {
                            var manifest = jsyaml.load(data)
                        } catch(e) {
                            gui.log_warning("Invalid manifest file for package "+package_name+": "+e.message)
                            return
                        }
                        if (manifest["manifest_schema"] != gui.supported_manifest_schema) return
                        // define tags
                        var tags = manifest["tags"].split(" ")
                        var tags_html = ""
                        for (var tag of tags) tags_html = tags_html+'<a class="label label-primary pull-right" onClick=\'$("#'+this_class.id+'_search").val("'+tag+'"); $("#'+this_class.id+'_search").keyup()\'>'+tag+'</a>&nbsp;'
                        // define modules
                        var modules = []
                        if (manifest["modules"].length > 0) {
                            for (var module_object of manifest["modules"]) {
                                for (var module in module_object) modules.push(module)                               
                            }
                        }
                        // define icon
                        var icon = "icon" in manifest ? manifest["icon"] : "box-open"
                        // define the item
                        var item_html = '\
                            <li class="item text-left" id="'+this_class.id+'_box_'+manifest["package"]+'">\
                              <div class="product-img">\
                                <i class="fas fa-'+icon+' fa-3x"></i>\
                              </div>\
                              <div class="product-info">\
                                <a class="product-title" target="_blank" href="https://github.com/'+manifest["github"]+'">'+manifest["package"]+'</a>\
                                <span class="pull-right-container">'+tags_html+'</span>\
                                <span class="product-description"><b>Version</b>: '+manifest["version"]+'-'+manifest["revision"]+' ('+manifest["branch"]+')</span>\
                                <span class="product-description"><b>Modules</b>: '+modules.join(", ")+'</span>\
                                <span class="product-description"><b>Description</b>: '+manifest["description"]+'</span>\
                              </div>\
                            </li>\
                        '
                        // add the marketplace item to the page
                        $("#"+this_class.id+"_marketplace").append(item_html)
                        this_class.manifests.push(manifest)
                    });
                });   
            }
        });
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _table
        var body = "#"+this.id+"_body"
        this.manifests = []
        $("#"+this.id+"_marketplace").empty()
        var search_html = '\
            <div class="input-group input-group-lg">\
                <input id="'+this.id+'_search" class="form-control input-lg" type="text" placeholder="Search the marketplace...">\
            </div><br>'
        $(body).append(search_html)
        // listen for changes
        var this_class = this
        $("#"+this.id+"_search").unbind().keyup(function(this_class) {
            return function () {
                var search = $("#"+this_class.id+"_search").val()
                for (var manifest of this_class.manifests) {
                    if (manifest["package"].includes(search) || manifest["description"].includes(search) || manifest["tags"].includes(search)) $("#"+this_class.id+"_box_"+manifest["package"]).removeClass("hidden")
                    else $("#"+this_class.id+"_box_"+manifest["package"]).addClass("hidden")
                }
            };
        }(this));
        $(body).append('<ul class="products-list product-list-in-box" id="'+this.id+'_marketplace"><li><i class="fas fa-spin fa-3x fa-spinner"></i> Loading marketplace...</li></ul>')
        this.load_marketplace()
    }
    
        
    // close the widget
    close() {
    }    
    
    // receive data and load it into the widget
    on_message(message) {
    }
    
    // receive configuration
    on_configuration(message) {
    }
}