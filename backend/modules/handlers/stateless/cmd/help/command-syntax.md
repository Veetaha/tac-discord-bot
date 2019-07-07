**Command template symbols**
`<...param>` defines variable amount of parameters (minimum `1` required)
`<param?>` defines optional parameter
`<...param?>` defines variable amount of parameters (minimum `0` required)

**Command parameters syntax**
Command parameters must be whitespace-separated.
```${cmdPrefix}pony luna celestia```
If command parameter contains whitespace, enclose it with double quotes. 
```${cmdPrefix}pony "pinkie pie"```
Here `pinkie pie` is parsed as a single parameter but not as two. 
In order to use double quotes inside of quoted parameters you  need to 
escape them with `\`. 
```${cmdPrefix}pony "Trixie \"The Great and Powerful\""``` 
In order to use `\` symbol inside of quoted parameters, you need to escape it too: 
```${cmdPrefix}pony "D:\\\\Windows\\My Directory"```