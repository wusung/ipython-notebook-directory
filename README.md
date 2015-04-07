# IPython Notebook Module Directory
--------------

## How to install

### Install IPython-notebook-module-directory
To install this tabs extension, please follow these steps:

1. Copy all files in the projects to `~/.ipython/profile_default/static/custom`.
2. Load module-directory extension in your custom.js. For example: `~/.ipython/profile_default/static/custom/custom.js`
	
```javascript
require(["custom/module-directory"], 
        function (events) {

});
```

3. Load extra css definition in `~/.ipython/profile_default/static/custom/custom.css`

```css
@import url("jquery.treeview.css");
@import url("jquery.contextMenu.css");

.context-menu-item {
    padding-top: 6px;
    padding-bottom: 6px;
}
```