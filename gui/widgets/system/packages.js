// Packages widget
class Packages extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.listener = null
        this.manifests = {}
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _table
        // if refresh requested, we need to unsubscribe from the topics to receive them again
        if (this.listener != null) {
            this.remove_listener(this.listener)
            this.manifests = {}
        }
        var body = "#"+this.id+"_body"
        $(body).html("")
        // add table
        // 0: package
        // 1: description
        // 2: modules
        // 3: version
        // 4: up to date
        // 5: manifest
        var table = '\
            <table id="'+this.id+'_table" class="table table-bordered table-striped">\
                <thead>\
                    <tr><th>Package</th><th>Description</th><th>Modules</th><th>Version</th><th>Up to Date</th><th>Manifest</th></tr>\
                </thead>\
                <tbody></tbody>\
            </table>'
        $(body).html(table)
        
        // define datatables options
        var options = {
            "responsive": true,
            "dom": "Zlfrtip",
            "fixedColumns": false,
            "paging": false,
            "lengthChange": false,
            "searching": true,
            "ordering": true,
            "info": true,
            "autoWidth": true,
            "columnDefs": [ 
                {
                    "className": "dt-center",
                    "targets": [3, 4, 5]
                }
            ],
            "language": {
                "emptyTable": '<span id="'+this.id+'_table_text"></span>'
            }
        };
        // create the table
        $("#"+this.id+"_table").DataTable(options);
        $("#"+this.id+"_table_text").html('<i class="fas fa-spinner fa-spin"></i> Loading')
        // ask for manifest files
        this.listener = this.add_broadcast_listener("+/+", "MANIFEST", "#")
    }
    
    // receive data and load it into the widget
    on_message(message) {
        if (message.command == "MANIFEST") {
            var table = $("#"+this.id+"_table").DataTable()
            var manifest = message.get_data()
            if (manifest["package"] in this.manifests) return
            if (manifest["manifest_schema"] != gui.supported_manifest_schema) return
            // add a new row for this package
            var icon = "icon" in manifest ? manifest["icon"] : "cube"
            var package_name = '<i class="fas fa-'+icon+'"></i> '+manifest["package"]
            var description =  format_multiline(manifest["description"], 50)
            var update_id = this.id+'_'+manifest["package"]+'_update'
            var modules = ""
            for (var module_object of manifest["modules"]) {
                for (var module in module_object) modules = modules+module+"<br>"
            }
            var version = manifest["version"].toFixed(1)+"-"+manifest["revision"]+" ("+manifest["branch"]+")"
            var up_to_date = '<span id="'+update_id+'"><i class="fas fa-spinner fa-spin"></span>'
            var manifest_button = '<button type="button" id="'+this.id+'_manifest_'+manifest["package"].replace("/", "_")+'" class="btn btn-default"><i class="fas fa-newspaper"></i></button>'
            table.row.add([package_name, description, modules, version, up_to_date, manifest_button]).draw();
            $("#"+this.id+'_manifest_'+manifest["package"].replace("/", "_")).unbind().click(function(this_class, manifest) {
                return function () {
                    // clear the modal and load it
                    $("#wizard_body").html("")
                    $("#wizard_title").html(manifest["package"]+" manifest")
                    $("#wizard_body").append('\
                        <div class="form-group text-left">\
                            <textarea rows=15 class="form-control" id="manifest_textarea">'+jsyaml.dump(manifest)+'</textarea>\
                            </div>\
                    ')
                    // CodeMirror doesn't work with hidden tabs, refresh it when a new tab is open
                    $('#wizard').one('show.bs.modal', function () {
                        // Prettify the textarea with CodeMirror
                        var codemirror_options = {
                                lineNumbers: false,
                                readOnly: true,
                                mode: "yaml",
                                indentWithTabs: true,
                                tabSize: 2,
                        }
                        var codemirror = CodeMirror.fromTextArea(document.getElementById("manifest_textarea"), codemirror_options);
                        // TODO: despite this, the textarea shows up only on click
                        $('#manifest_textarea').trigger("click")
                    })
                    $('#wizard_save').addClass("d-none")
                    $('#wizard').one('hidden.bs.modal', function () {
                        $('#wizard_save').removeClass("d-none")
                    })
                    $("#wizard").modal()                                        
                };
            }(this, manifest));
            if (table.data().count() == 0) $("#"+this.id+"_table_text").html('No data to display')
            // check for update
            var url = "https://raw.githubusercontent.com/"+manifest["github"]+"/"+manifest["branch"]+"/manifest.yml?timestamp="+new Date().getTime()
            $.get(url, function(data) {
                var remote_manifest = jsyaml.load(data)
                if (remote_manifest["manifest_schema"] != gui.supported_manifest_schema) {
                    $("#"+update_id).html('<i class="fas fa-question">')
                    return
                }
                if (remote_manifest["version"] > manifest["version"] || (remote_manifest["version"] == manifest["version"] && remote_manifest["revision"] > manifest["revision"])) $("#"+update_id).html('<a href="https://github.com/'+manifest["github"]+'/tree/'+manifest["branch"]+'" target="_blank" ><i class="fas fa-external-link-alt"></i></a>')
                else $("#"+update_id).html('<i class="fas fa-check text-success">')
            });
            this.manifests[manifest["package"]] = manifest
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}